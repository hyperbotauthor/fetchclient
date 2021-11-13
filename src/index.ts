import { stringify } from 'query-string';

import { ParsedGame } from './models/lichess/game';

const lichess = {
  ParsedGame,
};

export { lichess };

export type FetchFunction = (url: string, setup: any) => Promise<any>;

export type Params = {
  raw?: any;
  bearer?: string;
  apiBaseUrl?: string;
  urlParams?: Object;
  headers?: Object;
  method?: string;
};

export type BodyType = string | { [key: string]: string };

function encodeBody(
  body?: string | { [key: string]: string } | undefined,
  encoding?: string | undefined
): string | undefined {
  if (body === undefined) return undefined;

  if (typeof body === 'string') return body;

  if (encoding === undefined || encoding === 'json') return JSON.stringify(body);

  const formBody = [];

  for (var property in body) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(body[property]);
    formBody.push(encodedKey + '=' + encodedValue);
  }

  return formBody.join('&');
}

export class FetchClient {
  fetch: FetchFunction;
  params: Params;

  constructor(setFetch: FetchFunction, params: Params) {
    this.fetch = setFetch;
    this.params = params;
    this.params.headers = params.headers || {};
    this.params.apiBaseUrl = this.params.apiBaseUrl || '';
    this.params.method = params.method || 'GET';
  }

  effParams(params?: Params): Params {
    if (params) {
      const effHeaders = { ...this.params.headers, ...(params.headers || {}) };
      params.headers = effHeaders;
      return { ...this.params, ...params };
    }
    return { ...this.params };
  }

  extend(endpoint: string, params: Params): FetchClient {
    const newClient = new FetchClient(this.fetch, {});
    newClient.params = this.effParams(params);
    newClient.params.apiBaseUrl += '/' + endpoint;
    return newClient;
  }

  fetchText(url: string, params?: Params, body?: BodyType, encoding?: string): Promise<string> {
    return new Promise((resolve: any, reject: any) => {
      const effParams = this.effParams(params);
      let effBody: any = undefined;
      const setup: any = {
        method: effParams.method,
        headers: effParams.headers,
        body: encodeBody(body, encoding),
      };
      if (effParams.bearer) setup.headers['Authorization'] = `Bearer ${effParams.bearer}`;
      let effUrl = url;
      if (effParams.apiBaseUrl) {
        effUrl = `${effParams.apiBaseUrl}/${url}`;
      }
      if (effParams.urlParams) {
        effUrl += '?' + stringify(effParams.urlParams);
      }
      console.log('request', effUrl, setup);
      this.fetch(effUrl, setup).then(response =>
        response.text().then((content: any) => {
          resolve(content);
        })
      );
    });
  }

  fetchJson(url: string, params?: Params, body?: BodyType, encoding?: string): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      this.fetchText(url, params, body, encoding).then((content: string) => {
        const blob = JSON.parse(content);
        resolve(blob);
      });
    });
  }

  fetchNdJson(url: string, params?: Params, body?: BodyType, encoding?: string): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      this.fetchText(url, params, body, encoding).then((content: string) => {
        const lines = content.split('\n');
        lines.pop();
        const blob = lines.map(line => JSON.parse(line));
        resolve(blob);
      });
    });
  }
}
