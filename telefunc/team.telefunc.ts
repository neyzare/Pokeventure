import { getContext } from "telefunc";
import { prisma } from "../server/prisma";
import argon2 from "argon2";
import cookie from "cookie";
import type { Request } from "express";

type TelefuncContext = {
  req?: Request;
};

function readCookie(req?: Request, name = "session") {
  const header = req?.headers?.cookie ?? "";
  const parsed = cookie.parse(header);
  return parsed[name] ?? null;
}

async function getUserIdFromSession(req?: Request): Promise<string | null> {
  const raw = readCookie(req, "session");
  if (!raw) return null;

  const [tokenId, token] = raw.split(".");
  if (!tokenId || !token) return null;

  const user = await prisma.user.findFirst({
    where: {
      sessionTokenId: tokenId,
      sessionExpiresAt: { gt: new Date() },
    },
    select: { id: true, sessionTokenHash: true },
  });

  if (!user?.sessionTokenHash) return null;

  const ok = await argon2.verify(user.sessionTokenHash, token);
  if (!ok) return null;

  return user.id;
}

export async function getMyTeam(): Promise<
  | { success: false; error: string }
  | { success: true; team: Array<{ pokemonId: number }> }
> {
  const { req } = getContext<TelefuncContext>();

  const userId = await getUserIdFromSession(req);
  if (!userId) return { success: false, error: "Non connecté" };

  const team = await prisma.pokedex.findMany({
    where: { userId, inTeam: true },
    take: 3,
    orderBy: { updatedAt: "desc" },
    select: { pokemonId: true },
  });

  return { success: true, team };
}
