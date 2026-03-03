import { cookies } from "next/headers";
import { prisma } from "./prisma";
import argon2 from "argon2";

export async function readCookie(name = "session"): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(name);
  return cookie?.value ?? null;
}

export async function getUserIdFromSession(): Promise<string | null> {
  const raw = await readCookie("session");
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

export async function getAuthenticatedUser(): Promise<{
  id: string;
  username: string | null;
} | null> {
  const raw = await readCookie("session");
  if (!raw) return null;

  const [tokenId, token] = raw.split(".");
  if (!tokenId || !token) return null;

  const user = await prisma.user.findFirst({
    where: {
      sessionTokenId: tokenId,
      sessionExpiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      username: true,
      sessionTokenHash: true,
    },
  });

  if (!user || !user.sessionTokenHash) return null;

  const ok = await argon2.verify(user.sessionTokenHash, token);
  if (!ok) return null;

  return { id: user.id, username: user.username };
}
