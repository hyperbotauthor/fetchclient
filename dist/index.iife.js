var fetchclient = (function (exports) {
	'use strict';

	var queryString = {};

	var strictUriEncode = str => encodeURIComponent(str).replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

	var token = '%[a-f0-9]{2}';
	var singleMatcher = new RegExp(token, 'gi');
	var multiMatcher = new RegExp('(' + token + ')+', 'gi');

	function decodeComponents(components, split) {
		try {
			// Try to decode the entire string first
			return decodeURIComponent(components.join(''));
		} catch (err) {
			// Do nothing
		}

		if (components.length === 1) {
			return components;
		}

		split = split || 1;

		// Split the array in 2 parts
		var left = components.slice(0, split);
		var right = components.slice(split);

		return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
	}

	function decode(input) {
		try {
			return decodeURIComponent(input);
		} catch (err) {
			var tokens = input.match(singleMatcher);

			for (var i = 1; i < tokens.length; i++) {
				input = decodeComponents(tokens, i).join('');

				tokens = input.match(singleMatcher);
			}

			return input;
		}
	}

	function customDecodeURIComponent(input) {
		// Keep track of all the replacements and prefill the map with the `BOM`
		var replaceMap = {
			'%FE%FF': '\uFFFD\uFFFD',
			'%FF%FE': '\uFFFD\uFFFD'
		};

		var match = multiMatcher.exec(input);
		while (match) {
			try {
				// Decode as big chunks as possible
				replaceMap[match[0]] = decodeURIComponent(match[0]);
			} catch (err) {
				var result = decode(match[0]);

				if (result !== match[0]) {
					replaceMap[match[0]] = result;
				}
			}

			match = multiMatcher.exec(input);
		}

		// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
		replaceMap['%C2'] = '\uFFFD';

		var entries = Object.keys(replaceMap);

		for (var i = 0; i < entries.length; i++) {
			// Replace all decoded components
			var key = entries[i];
			input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
		}

		return input;
	}

	var decodeUriComponent = function (encodedURI) {
		if (typeof encodedURI !== 'string') {
			throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
		}

		try {
			encodedURI = encodedURI.replace(/\+/g, ' ');

			// Try the built in decoder first
			return decodeURIComponent(encodedURI);
		} catch (err) {
			// Fallback to a more advanced decoder
			return customDecodeURIComponent(encodedURI);
		}
	};

	var splitOnFirst = (string, separator) => {
		if (!(typeof string === 'string' && typeof separator === 'string')) {
			throw new TypeError('Expected the arguments to be of type `string`');
		}

		if (separator === '') {
			return [string];
		}

		const separatorIndex = string.indexOf(separator);

		if (separatorIndex === -1) {
			return [string];
		}

		return [
			string.slice(0, separatorIndex),
			string.slice(separatorIndex + separator.length)
		];
	};

	var filterObj = function (obj, predicate) {
		var ret = {};
		var keys = Object.keys(obj);
		var isArr = Array.isArray(predicate);

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var val = obj[key];

			if (isArr ? predicate.indexOf(key) !== -1 : predicate(key, val, obj)) {
				ret[key] = val;
			}
		}

		return ret;
	};

	(function (exports) {
	const strictUriEncode$1 = strictUriEncode;
	const decodeComponent = decodeUriComponent;
	const splitOnFirst$1 = splitOnFirst;
	const filterObject = filterObj;

	const isNullOrUndefined = value => value === null || value === undefined;

	const encodeFragmentIdentifier = Symbol('encodeFragmentIdentifier');

	function encoderForArrayFormat(options) {
		switch (options.arrayFormat) {
			case 'index':
				return key => (result, value) => {
					const index = result.length;

					if (
						value === undefined ||
						(options.skipNull && value === null) ||
						(options.skipEmptyString && value === '')
					) {
						return result;
					}

					if (value === null) {
						return [...result, [encode(key, options), '[', index, ']'].join('')];
					}

					return [
						...result,
						[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')
					];
				};

			case 'bracket':
				return key => (result, value) => {
					if (
						value === undefined ||
						(options.skipNull && value === null) ||
						(options.skipEmptyString && value === '')
					) {
						return result;
					}

					if (value === null) {
						return [...result, [encode(key, options), '[]'].join('')];
					}

					return [...result, [encode(key, options), '[]=', encode(value, options)].join('')];
				};

			case 'comma':
			case 'separator':
			case 'bracket-separator': {
				const keyValueSep = options.arrayFormat === 'bracket-separator' ?
					'[]=' :
					'=';

				return key => (result, value) => {
					if (
						value === undefined ||
						(options.skipNull && value === null) ||
						(options.skipEmptyString && value === '')
					) {
						return result;
					}

					// Translate null to an empty string so that it doesn't serialize as 'null'
					value = value === null ? '' : value;

					if (result.length === 0) {
						return [[encode(key, options), keyValueSep, encode(value, options)].join('')];
					}

					return [[result, encode(value, options)].join(options.arrayFormatSeparator)];
				};
			}

			default:
				return key => (result, value) => {
					if (
						value === undefined ||
						(options.skipNull && value === null) ||
						(options.skipEmptyString && value === '')
					) {
						return result;
					}

					if (value === null) {
						return [...result, encode(key, options)];
					}

					return [...result, [encode(key, options), '=', encode(value, options)].join('')];
				};
		}
	}

	function parserForArrayFormat(options) {
		let result;

		switch (options.arrayFormat) {
			case 'index':
				return (key, value, accumulator) => {
					result = /\[(\d*)\]$/.exec(key);

					key = key.replace(/\[\d*\]$/, '');

					if (!result) {
						accumulator[key] = value;
						return;
					}

					if (accumulator[key] === undefined) {
						accumulator[key] = {};
					}

					accumulator[key][result[1]] = value;
				};

			case 'bracket':
				return (key, value, accumulator) => {
					result = /(\[\])$/.exec(key);
					key = key.replace(/\[\]$/, '');

					if (!result) {
						accumulator[key] = value;
						return;
					}

					if (accumulator[key] === undefined) {
						accumulator[key] = [value];
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};

			case 'comma':
			case 'separator':
				return (key, value, accumulator) => {
					const isArray = typeof value === 'string' && value.includes(options.arrayFormatSeparator);
					const isEncodedArray = (typeof value === 'string' && !isArray && decode(value, options).includes(options.arrayFormatSeparator));
					value = isEncodedArray ? decode(value, options) : value;
					const newValue = isArray || isEncodedArray ? value.split(options.arrayFormatSeparator).map(item => decode(item, options)) : value === null ? value : decode(value, options);
					accumulator[key] = newValue;
				};

			case 'bracket-separator':
				return (key, value, accumulator) => {
					const isArray = /(\[\])$/.test(key);
					key = key.replace(/\[\]$/, '');

					if (!isArray) {
						accumulator[key] = value ? decode(value, options) : value;
						return;
					}

					const arrayValue = value === null ?
						[] :
						value.split(options.arrayFormatSeparator).map(item => decode(item, options));

					if (accumulator[key] === undefined) {
						accumulator[key] = arrayValue;
						return;
					}

					accumulator[key] = [].concat(accumulator[key], arrayValue);
				};

			default:
				return (key, value, accumulator) => {
					if (accumulator[key] === undefined) {
						accumulator[key] = value;
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};
		}
	}

	function validateArrayFormatSeparator(value) {
		if (typeof value !== 'string' || value.length !== 1) {
			throw new TypeError('arrayFormatSeparator must be single character string');
		}
	}

	function encode(value, options) {
		if (options.encode) {
			return options.strict ? strictUriEncode$1(value) : encodeURIComponent(value);
		}

		return value;
	}

	function decode(value, options) {
		if (options.decode) {
			return decodeComponent(value);
		}

		return value;
	}

	function keysSorter(input) {
		if (Array.isArray(input)) {
			return input.sort();
		}

		if (typeof input === 'object') {
			return keysSorter(Object.keys(input))
				.sort((a, b) => Number(a) - Number(b))
				.map(key => input[key]);
		}

		return input;
	}

	function removeHash(input) {
		const hashStart = input.indexOf('#');
		if (hashStart !== -1) {
			input = input.slice(0, hashStart);
		}

		return input;
	}

	function getHash(url) {
		let hash = '';
		const hashStart = url.indexOf('#');
		if (hashStart !== -1) {
			hash = url.slice(hashStart);
		}

		return hash;
	}

	function extract(input) {
		input = removeHash(input);
		const queryStart = input.indexOf('?');
		if (queryStart === -1) {
			return '';
		}

		return input.slice(queryStart + 1);
	}

	function parseValue(value, options) {
		if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
			value = Number(value);
		} else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
			value = value.toLowerCase() === 'true';
		}

		return value;
	}

	function parse(query, options) {
		options = Object.assign({
			decode: true,
			sort: true,
			arrayFormat: 'none',
			arrayFormatSeparator: ',',
			parseNumbers: false,
			parseBooleans: false
		}, options);

		validateArrayFormatSeparator(options.arrayFormatSeparator);

		const formatter = parserForArrayFormat(options);

		// Create an object with no prototype
		const ret = Object.create(null);

		if (typeof query !== 'string') {
			return ret;
		}

		query = query.trim().replace(/^[?#&]/, '');

		if (!query) {
			return ret;
		}

		for (const param of query.split('&')) {
			if (param === '') {
				continue;
			}

			let [key, value] = splitOnFirst$1(options.decode ? param.replace(/\+/g, ' ') : param, '=');

			// Missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			value = value === undefined ? null : ['comma', 'separator', 'bracket-separator'].includes(options.arrayFormat) ? value : decode(value, options);
			formatter(decode(key, options), value, ret);
		}

		for (const key of Object.keys(ret)) {
			const value = ret[key];
			if (typeof value === 'object' && value !== null) {
				for (const k of Object.keys(value)) {
					value[k] = parseValue(value[k], options);
				}
			} else {
				ret[key] = parseValue(value, options);
			}
		}

		if (options.sort === false) {
			return ret;
		}

		return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce((result, key) => {
			const value = ret[key];
			if (Boolean(value) && typeof value === 'object' && !Array.isArray(value)) {
				// Sort object keys, not values
				result[key] = keysSorter(value);
			} else {
				result[key] = value;
			}

			return result;
		}, Object.create(null));
	}

	exports.extract = extract;
	exports.parse = parse;

	exports.stringify = (object, options) => {
		if (!object) {
			return '';
		}

		options = Object.assign({
			encode: true,
			strict: true,
			arrayFormat: 'none',
			arrayFormatSeparator: ','
		}, options);

		validateArrayFormatSeparator(options.arrayFormatSeparator);

		const shouldFilter = key => (
			(options.skipNull && isNullOrUndefined(object[key])) ||
			(options.skipEmptyString && object[key] === '')
		);

		const formatter = encoderForArrayFormat(options);

		const objectCopy = {};

		for (const key of Object.keys(object)) {
			if (!shouldFilter(key)) {
				objectCopy[key] = object[key];
			}
		}

		const keys = Object.keys(objectCopy);

		if (options.sort !== false) {
			keys.sort(options.sort);
		}

		return keys.map(key => {
			const value = object[key];

			if (value === undefined) {
				return '';
			}

			if (value === null) {
				return encode(key, options);
			}

			if (Array.isArray(value)) {
				if (value.length === 0 && options.arrayFormat === 'bracket-separator') {
					return encode(key, options) + '[]';
				}

				return value
					.reduce(formatter(key), [])
					.join('&');
			}

			return encode(key, options) + '=' + encode(value, options);
		}).filter(x => x.length > 0).join('&');
	};

	exports.parseUrl = (url, options) => {
		options = Object.assign({
			decode: true
		}, options);

		const [url_, hash] = splitOnFirst$1(url, '#');

		return Object.assign(
			{
				url: url_.split('?')[0] || '',
				query: parse(extract(url), options)
			},
			options && options.parseFragmentIdentifier && hash ? {fragmentIdentifier: decode(hash, options)} : {}
		);
	};

	exports.stringifyUrl = (object, options) => {
		options = Object.assign({
			encode: true,
			strict: true,
			[encodeFragmentIdentifier]: true
		}, options);

		const url = removeHash(object.url).split('?')[0] || '';
		const queryFromUrl = exports.extract(object.url);
		const parsedQueryFromUrl = exports.parse(queryFromUrl, {sort: false});

		const query = Object.assign(parsedQueryFromUrl, object.query);
		let queryString = exports.stringify(query, options);
		if (queryString) {
			queryString = `?${queryString}`;
		}

		let hash = getHash(object.url);
		if (object.fragmentIdentifier) {
			hash = `#${options[encodeFragmentIdentifier] ? encode(object.fragmentIdentifier, options) : object.fragmentIdentifier}`;
		}

		return `${url}${queryString}${hash}`;
	};

	exports.pick = (input, filter, options) => {
		options = Object.assign({
			parseFragmentIdentifier: true,
			[encodeFragmentIdentifier]: false
		}, options);

		const {url, query, fragmentIdentifier} = exports.parseUrl(input, options);
		return exports.stringifyUrl({
			url,
			query: filterObject(query, filter),
			fragmentIdentifier
		}, options);
	};

	exports.exclude = (input, filter, options) => {
		const exclusionFilter = Array.isArray(filter) ? key => !filter.includes(key) : (key, value) => !filter(key, value);

		return exports.pick(input, exclusionFilter, options);
	};
	}(queryString));

	class ParsedGame {
	    constructor(game, myUsername) {
	        this.myUsername = myUsername;
	        this.id = game.id;
	        this.clock = game.clock;
	        this.variant = game.variant;
	        this.status = game.status;
	        let resultWhite = '1/2-1/2';
	        if (game.winner) {
	            resultWhite = game.winner === 'white' ? '1-0' : '0-1';
	        }
	        let resultBlack = '1/2-1/2';
	        if (game.winner) {
	            resultBlack = game.winner === 'white' ? '0-1' : '1-0';
	        }
	        this.white = {
	            name: game.players.white.user.name,
	            id: game.players.white.user.id,
	            rating: game.players.white.rating,
	            result: resultWhite,
	            decorated: `${game.players.white.user.name} ( ${game.players.white.rating} )`,
	        };
	        this.black = {
	            name: game.players.black.user.name,
	            id: game.players.black.user.id,
	            rating: game.players.black.rating,
	            result: resultBlack,
	            decorated: `${game.players.black.user.name} ( ${game.players.black.rating} )`,
	        };
	        this.me = this.white;
	        this.opp = this.black;
	        if (this.black.name === this.myUsername) {
	            this.me = this.black;
	            this.opp = this.white;
	        }
	        this.gameInfo = `${this.white.decorated} - ${this.black.decorated} ${this.white.result} [ ${this.clock.initial} + ${this.clock.increment} ] ${this.variant} [ ${this.status} ]`;
	        this.moves = [];
	        if (game.moves) {
	            this.moves = game.moves.split(' ');
	        }
	    }
	}

	const lichess = {
	    ParsedGame,
	};
	function encodeBody(body, encoding) {
	    if (body === undefined)
	        return undefined;
	    if (typeof body === 'string')
	        return body;
	    if (encoding === undefined || encoding === 'json')
	        return JSON.stringify(body);
	    const formBody = [];
	    for (var property in body) {
	        var encodedKey = encodeURIComponent(property);
	        var encodedValue = encodeURIComponent(body[property]);
	        formBody.push(encodedKey + '=' + encodedValue);
	    }
	    return formBody.join('&');
	}
	class FetchClient {
	    constructor(setFetch, params) {
	        this.fetch = setFetch;
	        this.params = params;
	        this.params.headers = params.headers || {};
	        this.params.apiBaseUrl = this.params.apiBaseUrl || '';
	        this.params.method = params.method || 'GET';
	    }
	    effParams(params) {
	        if (params) {
	            const effHeaders = Object.assign(Object.assign({}, this.params.headers), (params.headers || {}));
	            params.headers = effHeaders;
	            return Object.assign(Object.assign({}, this.params), params);
	        }
	        return Object.assign({}, this.params);
	    }
	    extend(endpoint, params) {
	        const newClient = new FetchClient(this.fetch, {});
	        newClient.params = this.effParams(params);
	        newClient.params.apiBaseUrl += '/' + endpoint;
	        return newClient;
	    }
	    fetchText(url, params, body, encoding) {
	        return new Promise((resolve, reject) => {
	            const effParams = this.effParams(params);
	            const setup = {
	                method: effParams.method,
	                headers: effParams.headers,
	                body: encodeBody(body, encoding),
	            };
	            if (effParams.bearer)
	                setup.headers['Authorization'] = `Bearer ${effParams.bearer}`;
	            let effUrl = url;
	            if (effParams.apiBaseUrl) {
	                effUrl = `${effParams.apiBaseUrl}/${url}`;
	            }
	            if (effParams.urlParams) {
	                effUrl += '?' + queryString.stringify(effParams.urlParams);
	            }
	            console.log('request', effUrl, setup);
	            this.fetch(effUrl, setup).then(response => response.text().then((content) => {
	                resolve(content);
	            }));
	        });
	    }
	    fetchJson(url, params, body, encoding) {
	        return new Promise((resolve, reject) => {
	            this.fetchText(url, params, body, encoding).then((content) => {
	                const blob = JSON.parse(content);
	                resolve(blob);
	            });
	        });
	    }
	    fetchNdJson(url, params, body, encoding) {
	        return new Promise((resolve, reject) => {
	            this.fetchText(url, params, body, encoding).then((content) => {
	                const lines = content.split('\n');
	                lines.pop();
	                const blob = lines.map(line => JSON.parse(line));
	                resolve(blob);
	            });
	        });
	    }
	}

	exports.FetchClient = FetchClient;
	exports.lichess = lichess;

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

})({});
