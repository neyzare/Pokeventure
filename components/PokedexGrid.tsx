import React from "react";
import { Grid, type CellComponentProps } from "react-window";
import type { Pokemon } from "../type/pokedex";
import { PokemonCard } from "./pokemonCard";

type CellProps = { pokemon: Pokemon[]; columns: number };

function Cell({ columnIndex, rowIndex, style, pokemon, columns }: CellComponentProps<CellProps>) {
  const index = rowIndex * columns + columnIndex;
  const item = pokemon[index];
  if (!item) return null;

  return (
    <div style={style} className="p-2">
      <PokemonCard pokemon={item} />
    </div>
  );
}

export function PokedexGrid({ pokemon }: { pokemon: Pokemon[] }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(1200);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 1200));

    ro.observe(el);
    setWidth(el.clientWidth || 1200);

    return () => ro.disconnect();
  }, []);

  const columns = width < 520 ? 2 : width < 900 ? 3 : width < 1200 ? 4 : 5;

  const gap = 24;

  const cardHeight = 116;
  const colWidth = Math.floor(width / columns);
  const rowCount = Math.ceil(pokemon.length / columns);

  return (
    <div ref={containerRef} className="w-full max-w-6xl mx-auto">
      <Grid
        columnCount={columns}
        columnWidth={colWidth}
        rowCount={rowCount}
        rowHeight={cardHeight + gap}
        cellComponent={Cell}
        cellProps={{ pokemon, columns }}
        style={{ width, height: 720 }}
        overscanCount={2}
      />
    </div>
  );
}
