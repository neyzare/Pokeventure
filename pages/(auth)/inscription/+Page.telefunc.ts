import { getContext } from "telefunc"
import { prisma } from "../../../server/prisma"
import argon2 from "argon2"
import crypto from "crypto";
import type { Response, Request } from "express"

type Starter = "arcko" | "poussifeu" | "gobou"

const STARTER_POKEMON_IDS: Record<Starter, number> = {
    arcko: 252,
    poussifeu: 255,
    gobou: 258
}

type RegisterData = {
    email: string
    password: string
}

type ProfileData = {
    trainerName: string
    starter: Starter
}

type TelefuncContext = {
    res?: Response
    req?: Request
}

function makeToken() {
    return crypto.randomBytes(32).toString("hex");
}

function makeId() {
    return crypto.randomBytes(12).toString("hex");
}

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function onRegister(
    data: RegisterData
){
    const { res } = getContext<TelefuncContext>();

    const tokenId = makeId();
    const token = makeToken();
    const tokenHash = await argon2.hash(token, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

    try {
        if (!data.email || !data.email.includes("@")) {
            return { success: false, error: "Email invalide" }
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
            return { success: false, error: "Cet email est déjà utilisé" }
        }

        const hashedPassword = await argon2.hash(data.password, {
            type: argon2.argon2id
        })

        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                username: null,
                starterPokemon: null,
                money: 3000,
                sessionTokenId: tokenId,
                sessionTokenHash: tokenHash,
                sessionExpiresAt: expiresAt,
            },
            select: { id: true, email: true },
        });

        try {
            if (res && typeof res.cookie === "function") {
                res.cookie("session", `${tokenId}.${token}`, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: SESSION_MAX_AGE_MS,
                    path: "/",
                });
            }
        } catch (cookieError) {
            console.warn("[REGISTER] Could not set session cookie:", cookieError)
        }

        const response = {
            success: true as const,
            userId: user.id,
            mail: user.email
        }
        return response
    } catch (error) {
        console.error("[REGISTER] Error:", error)
        return {
            success: false,
            error: "Une erreur est survenue lors de l'inscription"
        }
    }
}

export async function onUsernameExists(username: string) {
    if (!username || username.trim().length == 0) {
        return { success: false, error: "Le nom du dresseur doit être renseigné" }
    }else if (!username || username.length < 2) {
        return { success: false, error: "Le nom du dresseur doit contenir au moins 2 caractères" }
    }

    const existingUsername = await prisma.user.findUnique({
        where: { username }
    })
    if (existingUsername) {
        return { success: false, error: " Ce nom de dresseur est déjà utilisé" }
    }
    return { success: true, error: null }
}

export async function onProfile(data: ProfileData) {
    const { req, res } = getContext<TelefuncContext>();

    const raw = req?.cookies?.session;
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
        if (res && typeof res.clearCookie === "function") {
            res.clearCookie("session", { path: "/" });
        }
        return { success: false as const, error: "Session expirée" };
    }

    const ok = await argon2.verify(user.sessionTokenHash, token);
    if (!ok) return { success: false as const, error: "Session invalide" };

    if (!data.starter) {
        return { success: false, error: " Le pokemon starter doit être sélectionné" }
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
            inTeam: true
        }
    })

    return { success: true, error: null, user: updatedUser }
}
