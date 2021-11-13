export type LightUser = {
  name: string;
  id: string;
};

export type Player = {
  user: LightUser;
  rating: number;
  ratingDiff: number;
};

export type PlayerPov = {
  name: string;
  id: string;
  rating: number;
  result: string;
  decorated: string;
};

export type Players = {
  white: Player;
  black: Player;
};

export type Clock = {
  initial: number;
  increment: number;
  totalTime: number;
};

export type Game = {
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

export class ParsedGame {
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

  constructor(game: Game, myUsername: string | undefined) {
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
