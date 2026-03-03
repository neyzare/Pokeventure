import * as React from "react";

export type PokemonDetails = {
  types: string[];
  bst: number;
};

const cache = new Map<number, PokemonDetails>();
const inflight = new Map<number, Promise<PokemonDetails>>();

async function fetchDetails(id: number): Promise<PokemonDetails> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const json = await res.json();

  const types = (json.types as { slot: number; type: { name: string } }[])
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name);

  const bst = (json.stats as { base_stat: number }[]).reduce(
    (sum, s) => sum + s.base_stat,
    0
  );

  return { types, bst };
}

export function getPokemonDetails(id: number): Promise<PokemonDetails> {
  const cached = cache.get(id);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(id);
  if (pending) return pending;

  const p = fetchDetails(id)
    .then((d) => {
      cache.set(id, d);
      inflight.delete(id);
      return d;
    })
    .catch((e) => {
      inflight.delete(id);
      throw e;
    });

  inflight.set(id, p);
  return p;
}

export function usePokemonDetails(id: number) {
  const [details, setDetails] = React.useState<PokemonDetails | null>(
    () => cache.get(id) ?? null
  );

  React.useEffect(() => {
    let alive = true;
    if (cache.has(id)) {
      setDetails(cache.get(id)!);
      return;
    }
    getPokemonDetails(id)
      .then((d) => alive && setDetails(d))
      .catch(() => alive && setDetails({ types: [], bst: 0 }));
    return () => {
      alive = false;
    };
  }, [id]);

  return details;
}
