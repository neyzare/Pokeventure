import { PokedexGrid } from "@/components/PokedexGrid";
import type { Pokemon } from "@/type/pokedex";

function idFromSpeciesUrl(url: string) {
  const match = url.match(/\/pokemon-species\/(\d+)\//);
  return match ? Number(match[1]) : NaN;
}

async function getPokedexData(): Promise<{ pokemon: Pokemon[] }> {
  const response = await fetch(
    "https://pokeapi.co/api/v2/generation/3/",
    { next: { revalidate: 86400 } }
  );
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

export default async function PokedexPage() {
  const { pokemon } = await getPokedexData();

  return (
    <main className="p-6">
      <h1 className="text-3xl font-medium mb-6 text-center uppercase">
        Pokédex — Génération III
      </h1>
      <PokedexGrid pokemon={pokemon} />
    </main>
  );
}
