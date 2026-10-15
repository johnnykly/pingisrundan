export type GameType = 11 | 21;

export interface Player {
  id: string;
  name: string;
  createdAt: string;
}

export interface Match {
  id: string;
  /** YYYY-MM-DD (Europe/Stockholm) */
  date: string;
  type: GameType;
  p1: string;
  s1: number;
  p2: string;
  s2: number;
  winner: string;
  createdAt: string;
  deleted: boolean;
}

export interface Data {
  players: Player[];
  matches: Match[];
}
