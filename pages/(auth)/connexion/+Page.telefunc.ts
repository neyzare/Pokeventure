import { getContext } from "telefunc";
import { prisma } from "../../../server/prisma";
import argon2 from "argon2";
import crypto from "crypto";
import type { Response, Request } from "express";

type LoginData = {
  email: string;
  password: string;
};

type TelefuncContext = {
  res?: Response;
  req?: Request;
};

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

function makeId() {
  return crypto.randomBytes(12).toString("hex");
}

export async function onLogin(
  data: LoginData
): Promise<
  | { success: true; userId: string; username: string | null }
  | { success: false; error: string }
> {
  const { res } = getContext<TelefuncContext>();

  try {
    if (!data.email || !data.password) {
      return { success: false, error: "Email et mot de passe requis" };
    }
    if (!data.email.includes("@")) {
      return { success: false, error: "Email invalide" };
    }

    const email = data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, password: true },
    });

    if (!user) {
      return { success: false, error: "Email ou mot de passe incorrect" };
    }

    const okPassword = await argon2.verify(user.password, data.password);
    if (!okPassword) {
      return { success: false, error: "Email ou mot de passe incorrect" };
    }

    const tokenId = makeId();
    const token = makeToken();
    const tokenHash = await argon2.hash(token, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionTokenId: tokenId,
        sessionTokenHash: tokenHash,
        sessionExpiresAt: expiresAt,
      },
      select: { id: true },
    });

    if (res && typeof res.cookie === "function") {
      res.cookie("session", `${tokenId}.${token}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_MS,
        path: "/",
      });
    }

    return {
      success: true,
      userId: user.id,
      username: user.username ?? null,
    };
  } catch (error) {
    console.error("[LOGIN] Error:", error);
    return { success: false, error: "Une erreur est survenue lors de la connexion" };
  }
}

export async function onLogout(): Promise<{ success: true }> {
  const { req, res } = getContext<TelefuncContext>();

  try {
    const raw = req?.cookies?.session;

    if (raw) {
      const [tokenId] = raw.split(".");
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

    if (res && typeof res.clearCookie === "function") {
      res.clearCookie("session", { path: "/" });
    }
  } catch (cookieError) {
    console.warn("[LOGOUT] Logout warning:", cookieError);
  }

  return { success: true };
}
