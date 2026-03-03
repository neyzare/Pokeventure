"use server";

import { prisma } from "@/lib/prisma";
import { getUserIdFromSession } from "@/lib/auth";

export async function getMyTeamAction(): Promise<
  | { success: false; error: string }
  | { success: true; team: Array<{ pokemonId: number }> }
> {
  const userId = await getUserIdFromSession();
  if (!userId) return { success: false, error: "Non connecté" };

  const team = await prisma.pokedex.findMany({
    where: { userId, inTeam: true },
    take: 3,
    orderBy: { updatedAt: "desc" },
    select: { pokemonId: true },
  });

  return { success: true, team };
}
