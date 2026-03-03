"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export type PokemonItem = {
  id: number;
  pokemonId: number;
  name: string;
  sprite: string;
  inTeam: boolean;
};

export async function getInventoryAction(): Promise<
  | { success: true; pokemon: PokemonItem[]; money: number }
  | { success: false; error: string }
> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Non connecté" };

  try {
    const [userRecord, pokedex] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id } }),
      prisma.pokedex.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!userRecord) return { success: false, error: "Utilisateur introuvable" };

    const pokemon = await Promise.all(
      pokedex.map(async (p) => {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${p.pokemonId}`
        );
        const data = await res.json();
        return {
          id: p.id,
          pokemonId: p.pokemonId,
          name: data.name,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`,
          inTeam: p.inTeam,
        };
      })
    );

    return { success: true, pokemon, money: userRecord.money };
  } catch (error) {
    console.error("[INVENTORY]", error);
    return { success: false, error: "Erreur" };
  }
}

export async function toggleTeamAction(pokemonId: number): Promise<
  | { success: true }
  | { success: false; error: string }
> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "Non connecté" };

  try {
    const entry = await prisma.pokedex.findFirst({
      where: { userId: user.id, pokemonId },
    });

    if (!entry) return { success: false, error: "Pokémon introuvable" };

    const teamCount = await prisma.pokedex.count({
      where: { userId: user.id, inTeam: true },
    });

    if (!entry.inTeam && teamCount >= 6) {
      return { success: false, error: "Équipe complète (max 6)" };
    }

    await prisma.pokedex.update({
      where: { id: entry.id },
      data: { inTeam: !entry.inTeam },
    });

    return { success: true };
  } catch (error) {
    console.error("[INVENTORY]", error);
    return { success: false, error: "Erreur" };
  }
}
