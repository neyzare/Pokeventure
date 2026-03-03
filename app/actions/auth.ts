"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";
import crypto from "crypto";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

function makeId() {
  return crypto.randomBytes(12).toString("hex");
}

export async function getMeAction(): Promise<
  | { isLoggedIn: false }
  | { isLoggedIn: true; user: { id: string; email: string; username: string | null } }
> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get("session")?.value ?? null;

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

export async function logoutAction(): Promise<{ success: true }> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get("session")?.value ?? null;

  if (rawSession) {
    const [tokenId] = rawSession.split(".");
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

  cookieStore.delete("session");
  return { success: true };
}

export async function loginAction(data: {
  email: string;
  password: string;
}): Promise<
  | { success: true; userId: string; username: string | null }
  | { success: false; error: string }
> {
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

    const cookieStore = await cookies();
    cookieStore.set("session", `${tokenId}.${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS / 1000,
      path: "/",
    });

    return {
      success: true,
      userId: user.id,
      username: user.username ?? null,
    };
  } catch (error) {
    console.error("[LOGIN] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la connexion",
    };
  }
}

export async function registerAction(data: {
  email: string;
  password: string;
}): Promise<
  | { success: true; userId: string; mail: string }
  | { success: false; error: string }
> {
  const tokenId = makeId();
  const token = makeToken();
  const tokenHash = await argon2.hash(token, { type: argon2.argon2id });
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  try {
    if (!data.email || !data.email.includes("@")) {
      return { success: false, error: "Email invalide" };
    }

    const password = data.password ?? "";
    const passwordTooShort = password.length < 12;
    const missingUppercase = !/[A-Z]/.test(password);
    const missingNumber = !/[0-9]/.test(password);
    const missingSpecial = !/[^A-Za-z0-9]/.test(password);

    if (passwordTooShort || missingUppercase || missingNumber || missingSpecial) {
      return {
        success: false,
        error:
          "Mot de passe invalide : 12 caractères minimum, avec au moins 1 majuscule, 1 chiffre et 1 caractère spécial.",
      };
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existingEmail) {
      return { success: false, error: "Cet email est déjà utilisé" };
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: await argon2.hash(data.password, { type: argon2.argon2id }),
        username: null,
        starterPokemon: null,
        money: 3000,
        sessionTokenId: tokenId,
        sessionTokenHash: tokenHash,
        sessionExpiresAt: expiresAt,
      },
      select: { id: true, email: true },
    });

    const cookieStore = await cookies();
    cookieStore.set("session", `${tokenId}.${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS / 1000,
      path: "/",
    });

    return {
      success: true as const,
      userId: user.id,
      mail: user.email,
    };
  } catch (error) {
    console.error("[REGISTER] Error:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de l'inscription",
    };
  }
}

type Starter = "arcko" | "poussifeu" | "gobou";

const STARTER_POKEMON_IDS: Record<Starter, number> = {
  arcko: 252,
  poussifeu: 255,
  gobou: 258,
};

export async function profileAction(data: {
  trainerName: string;
  starter: Starter;
}): Promise<
  | { success: true; error: null; user: { id: string; username: string | null; starterPokemon: string | null; email: string } }
  | { success: false; error: string }
> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("session")?.value ?? null;

  if (!raw) return { success: false as const, error: "Non connecté" };

  const [tokenId, token] = raw.split(".");
  if (!tokenId || !token) {
    return { success: false as const, error: "Session invalide" };
  }

  const user = await prisma.user.findFirst({
    where: { sessionTokenId: tokenId },
    select: {
      id: true,
      sessionTokenHash: true,
      sessionExpiresAt: true,
    },
  });

  if (!user || !user.sessionTokenHash || !user.sessionExpiresAt) {
    return { success: false as const, error: "Session invalide" };
  }

  if (user.sessionExpiresAt.getTime() < Date.now()) {
    cookieStore.delete("session");
    return { success: false as const, error: "Session expirée" };
  }

  const ok = await argon2.verify(user.sessionTokenHash, token);
  if (!ok) return { success: false as const, error: "Session invalide" };

  if (!data.starter) {
    return { success: false, error: " Le pokemon starter doit être sélectionné" };
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      username: data.trainerName,
      starterPokemon: data.starter,
    },
    select: { id: true, username: true, starterPokemon: true, email: true },
  });

  await prisma.pokedex.create({
    data: {
      userId: updatedUser.id,
      pokemonId: STARTER_POKEMON_IDS[data.starter],
      inTeam: true,
    },
  });

  return {
    success: true,
    error: null,
    user: {
      ...updatedUser,
      starterPokemon: updatedUser.starterPokemon,
    },
  };
}

export async function usernameExistsAction(
  username: string
): Promise<{ success: true; error: null } | { success: false; error: string }> {
  if (!username || username.trim().length === 0) {
    return {
      success: false,
      error: "Le nom du dresseur doit être renseigné",
    };
  }
  if (username.length < 2) {
    return {
      success: false,
      error: "Le nom du dresseur doit contenir au moins 2 caractères",
    };
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    return {
      success: false,
      error: " Ce nom de dresseur est déjà utilisé",
    };
  }
  return { success: true, error: null };
}
