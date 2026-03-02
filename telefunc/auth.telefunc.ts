import { getContext } from "telefunc";
import { prisma } from "../server/prisma";
import type { Request, Response } from "express";
import cookie from "cookie";
import argon2 from "argon2"

type TelefuncContext = {
  req?: Request;
  res?: Response;
};

function readCookie(req?: Request, name = "session") {
  const header = req?.headers?.cookie ?? "";
  const parsed = cookie.parse(header);
  return parsed[name] ?? null;
}

export async function getMe(): Promise<
  | { isLoggedIn: false }
  | { isLoggedIn: true; user: { id: string; email: string; username: string | null } }
> {
  const { req } = getContext<TelefuncContext>();

  const rawSession = readCookie(req, "session");
  console.log("[getMe] rawSession:", rawSession);

  if (!rawSession) return { isLoggedIn: false };

  const [tokenId, token] = rawSession.split(".");
  if (!tokenId || !token) return { isLoggedIn: false };

  const user = await prisma.user.findFirst({
    where: {
      sessionTokenId: tokenId,
      sessionExpiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      username: true,
      sessionTokenHash: true,
      sessionExpiresAt: true,
    },
  });

  if (!user || !user.sessionTokenHash || !user.sessionExpiresAt) {
    return { isLoggedIn: false };
  }

  const ok = await argon2.verify(user.sessionTokenHash, token);
  if (!ok) return { isLoggedIn: false };

  return {
    isLoggedIn: true,
    user: { id: user.id, email: user.email, username: user.username },
  };

}

export async function logout(): Promise<{ success: true }> {
  const { req, res } = getContext<TelefuncContext>();

  const rawSession = readCookie(req, "session");
  if (rawSession) {
    const [tokenId] = rawSession.split(".");

    // ✅ Invalider côté DB (si tokenId existe)
    if (tokenId) {
      await prisma.user.updateMany({
        where: { sessionTokenId: tokenId },
        data: {
          sessionTokenId: null,
          sessionTokenHash: null,
          sessionExpiresAt: null,
        },
      });
    }
  }

  // ✅ Clear cookie côté navigateur
  if (res && typeof res.clearCookie === "function") {
    res.clearCookie("session", { path: "/" });
  } else if (res && typeof (res as any).cookie === "function") {
    // fallback: écrase le cookie avec expiration passée
    (res as any).cookie("session", "", { path: "/", maxAge: 0 });
  }

  return { success: true as const };
}