const bg: Record<string, string> = {
  grass: "bg-success/10",
  fire: "bg-error/10",
  water: "bg-info/10",
  electric: "bg-warning/10",
  psychic: "bg-secondary/10",
  ice: "bg-info/10",
  dragon: "bg-accent/10",
  dark: "bg-neutral/10",
  fairy: "bg-accent/10",
  normal: "bg-base-200",
  fighting: "bg-warning/10",
  flying: "bg-primary/10",
  poison: "bg-secondary/10",
  ground: "bg-warning/10",
  rock: "bg-neutral/10",
  bug: "bg-success/10",
  ghost: "bg-neutral/10",
  steel: "bg-base-200",
};

export function typeToBg(type: string) {
  return bg[type] ?? "bg-base-100";
}
