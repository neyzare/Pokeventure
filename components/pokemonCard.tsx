import type { Pokemon } from "../type/pokedex";
import { usePokemonDetails } from "../pages/pokedex/pokemonDetails";
import { typeToBg } from "../pages/pokedex/typeStyles";

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

export function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  const details = usePokemonDetails(pokemon.id);
  const mainType = details?.types?.[0];

  return (
    <div className={`card shadow-md hover:shadow-xl transition-shadow ${mainType ? typeToBg(mainType) : "bg-base-100"}`}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="badge badge-ghost text-xs">#{pad3(pokemon.id)}</span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            loading="lazy"
            decoding="async"
            width={72}
            height={72}
            className="w-16 h-16 pixelated"
          />

          <div className="min-w-0 flex-1">
            <div className="font-bold capitalize truncate">{pokemon.name}</div>
            <div className="text-xs opacity-70">
              {details ? `BST: ${details.bst}` : "Chargement…"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
