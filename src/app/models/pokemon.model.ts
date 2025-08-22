export interface PokemonDescription {
  game: string;
  text: string;
}

export interface Pokemon {
  id: number;
  name: string;
  number: number;
  // imageUrl?: string;
  species: string;
  height: number;
  weight: number;
  generation: number;
  base_experience: number;
  capture_rate: number;
  hatch_time?: number;
  base_friendship?: number;
  gender_male?: number;
  gender_female?: number;
  types: string[];
  descriptions?: {
    game: string;
    text: string;
  }[];
  abilities?: {
    name: string;
    description: string;
    is_hidden: boolean;
  }[];
  egg_groups?: string[];
  evolutions?: {
    to_pokemon_id: number;
    to_pokemon_name: string;
    from_pokemon_id: number;
    from_pokemon_name: string;
    method: string;
    level?: number;
  }[];
  forms?: {
    name?: string;
    label?: string;
    imageName?: string;
    types?: string[];
  }[];
  /** e.g. ["Alolan", "Galarian"] or [{ name:"Alolan", imageName:"0001-Bulbasaur-Alolan", types:["Grass","Poison"] }] */
  // forms?: Array<string | { name?: string; label?: string; imageName?: string; types?: string[] }>;

  /** Accept either an object map or an array of name/value */
  stats?: {
    hp: number; attack: number; defense: number; sp_atk: number; sp_def: number; speed: number;
  } | Array<{ name?: string; stat?: string; value?: number; base?: number }>;
}

