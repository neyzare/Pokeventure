"use client";

import { useState, useEffect } from "react";
import {
  getInventoryAction,
  toggleTeamAction,
  type PokemonItem,
} from "@/app/actions/inventaire";

function PokemonCard({
  pokemon,
  onToggle,
}: {
  pokemon: PokemonItem;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="card card-compact bg-base-100 shadow-xl hover:shadow-2xl transition-shadow relative">
      <button type="button" onClick={() => onToggle(pokemon.pokemonId)} className="w-full">
        <figure className="px-4 pt-4">
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            className="w-20 h-20"
          />
        </figure>
        <div className="card-body items-center text-center">
          <h3 className="card-title text-sm capitalize">{pokemon.name}</h3>
          <p className="text-xs opacity-60">#{pokemon.pokemonId}</p>
        </div>
      </button>

      {pokemon.inTeam && (
        <div className="badge badge-success absolute top-2 right-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function Inventaire() {
  const [pokemon, setPokemon] = useState<PokemonItem[]>([]);
  const [money, setMoney] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const res = await getInventoryAction();
    setLoading(false);
    if (res.success) {
      setPokemon(res.pokemon);
      setMoney(res.money);
    } else {
      setError(res.error);
    }
  };

  const toggleTeam = async (pokemonId: number) => {
    const res = await toggleTeamAction(pokemonId);
    if (res.success) {
      await loadInventory();
    } else {
      setError(res.error);
      setTimeout(() => setError(null), 3000);
    }
  };

  const team = pokemon.filter((p) => p.inTeam);
  const storage = pokemon.filter((p) => !p.inTeam);

  if (loading) {
    return <div className="text-center">Chargement...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-medium uppercase">Inventaire</h1>
        <div className="badge badge-warning badge-lg gap-2">
          <span>₽</span>
          <span className="font-bold">{money}</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-2xl font-bold">Équipe</h2>
          <div className="badge badge-primary">{team.length}/6</div>
        </div>

        {team.length === 0 ? (
          <div className="alert">
            <span>Aucun Pokémon dans l&apos;équipe</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {team.map((p) => (
              <PokemonCard key={p.id} pokemon={p} onToggle={toggleTeam} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Stockage</h2>
        {storage.length === 0 ? (
          <div className="alert">
            <span>Aucun Pokémon en stockage</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {storage.map((p) => (
              <PokemonCard key={p.id} pokemon={p} onToggle={toggleTeam} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
