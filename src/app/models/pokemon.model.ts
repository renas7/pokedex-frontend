export interface PokemonDescription {
  game: string;
  text: string;
}

export interface Pokemon {
  id: number;
  number: number;
  name: string;
  imageUrl: string;
  species?: string;
  height?: number;
  weight?: number;
  generation: number;
  base_experience?: number;
  capture_rate?: number;
  types: string[]; // array of types from the backend
  descriptions?: PokemonDescription[];
}
