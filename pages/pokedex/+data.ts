// pages/pokedex/+data.ts
import type { Pokemon } from "../../type/pokedex";

export type Data = Awaited<ReturnType<typeof data>>;

function idFromSpeciesUrl(url: string) {
  // ex: https://pokeapi.co/api/v2/pokemon-species/252/
  const match = url.match(/\/pokemon-species\/(\d+)\//);
  return match ? Number(match[1]) : NaN;
}

export async function data(): Promise<{ pokemon: Pokemon[] }> {
  const response = await fetch("https://pokeapi.co/api/v2/generation/3/");
  const gen = await response.json();

  const pokemon: Pokemon[] = gen.pokemon_species
    .map((p: { name: string; url: string }) => {
      const id = idFromSpeciesUrl(p.url);
      return {
        id,
        name: p.name,
    
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      };
    })
    .filter((p: Pokemon) => Number.isFinite(p.id))
    .sort((a: Pokemon, b: Pokemon) => a.id - b.id);

  return { pokemon };
}
