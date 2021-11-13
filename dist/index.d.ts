import { ParsedGame } from './models/lichess/game';
declare const lichess: {
    ParsedGame: typeof ParsedGame;
};
export { lichess };
export declare type FetchFunction = (url: string, setup: any) => Promise<any>;
export declare type Params = {
    raw?: any;
    bearer?: string;
    apiBaseUrl?: string;
    urlParams?: Object;
    headers?: Object;
    method?: string;
};
export declare type BodyType = string | {
    [key: string]: string;
};
export declare class FetchClient {
    fetch: FetchFunction;
    params: Params;
    constructor(setFetch: FetchFunction, params: Params);
    effParams(params?: Params): Params;
    extend(endpoint: string, params: Params): FetchClient;
    fetchText(url: string, params?: Params, body?: BodyType, encoding?: string): Promise<string>;
    fetchJson(url: string, params?: Params, body?: BodyType, encoding?: string): Promise<any>;
    fetchNdJson(url: string, params?: Params, body?: BodyType, encoding?: string): Promise<any>;
}
