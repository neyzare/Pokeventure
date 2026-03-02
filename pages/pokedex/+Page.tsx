// pages/pokedex/+Page.tsx
import React from "react";
import { useData } from "vike-react/useData";
import type { Data } from "./+data";
import { PokedexGrid } from "../../components/PokedexGrid";
import { getPokemonDetails } from "./pokemonDetails";

export function Page() {
  const data = useData<Data>();

  React.useEffect(() => {
    data.pokemon.slice(0, 20).forEach((p) => void getPokemonDetails(p.id));
  }, [data.pokemon]);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-medium mb-6 text-center uppercase">Pokédex — Génération III</h1>
      <PokedexGrid pokemon={data.pokemon} />
    </main>
  );
}
