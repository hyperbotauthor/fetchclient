export declare type LightUser = {
    name: string;
    id: string;
};
export declare type Player = {
    user: LightUser;
    rating: number;
    ratingDiff: number;
};
export declare type PlayerPov = {
    name: string;
    id: string;
    rating: number;
    result: string;
    decorated: string;
};
export declare type Players = {
    white: Player;
    black: Player;
};
export declare type Clock = {
    initial: number;
    increment: number;
    totalTime: number;
};
export declare type Game = {
    id: string;
    rated: boolean;
    variant: string;
    speed: string;
    perf: string;
    createdAt: number;
    lastMoveAt: number;
    status: string;
    players: Players;
    winner?: string;
    moves?: string;
    tournament?: string;
    clock: Clock;
};
export declare class ParsedGame {
    id: string;
    variant: string;
    myUsername: string | undefined;
    white: PlayerPov;
    black: PlayerPov;
    me: PlayerPov;
    opp: PlayerPov;
    gameInfo: string;
    status: string;
    moves: string[];
    clock: Clock;
    constructor(game: Game, myUsername: string | undefined);
}
