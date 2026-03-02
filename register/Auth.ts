
import { z } from "zod"
import bcrypt from "bcrypt"
import { prisma } from "../server/prisma"
import type { PageContextServer } from "vike/types"

const authSchema = z.object({
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide"),
    password: z.string().min(1, "Le mot de passe est requis")
})

const registerSchema = z.object({
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    trainerName: z.string().min(3, "Le nom du dresseur doit contenir au moins 3 caractères").max(20, "Le nom du dresseur ne peut pas dépasser 20 caractères"),
    starter: z.enum(["arcko", "poussifeu", "gobou"], {
        message: "Pokémon starter invalide"
    })
})

type LoginInput = {
    email: string
    password: string
}

type LoginResponse =
    | { success: true; id: string; user: string }
    | { success: false; error: string }

export async function loginAction(
    data: LoginInput,
    pageContext: PageContextServer
): Promise<LoginResponse> {
    try {
        console.log("[Login] Starting login process", { email: data.email })
        console.log("[Login] PageContext:", { hasReq: !!pageContext.req, hasRes: !!pageContext.res })
        
        const validateData = authSchema.safeParse(data)

        if (!validateData.success) {
            console.log("[Login] Validation failed:", validateData.error)
            return {
                success: false,
                error: "Format email ou password invalide"
            }
        }

        const { email, password } = validateData.data

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            console.log("[Login] User not found")
            return {
                success: false,
                error: "Email ou mot de passe incorrect"
            }
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            console.log("[Login] Password mismatch")
            return {
                success: false,
                error: "Email ou mot de passe incorrect"
            }
        }

        const sessionCookie = {
            userId: user.id,
            email: user.email
        }

        console.log("[Login] Setting cookie")
        pageContext.res?.cookie("session", JSON.stringify(sessionCookie), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7 * 1000,
            path: "/"
        })

        console.log("[Login] Login successful")
        return {
            success: true,
            id: user.id,
            user: user.email
        }

    } catch (e) {
        console.error("[Login] Error:", e)

        return {
            success: false,
            error: "Une erreur est survenue lors de la connexion"
        }
    }
}

export async function logoutAction(pageContext: PageContextServer) {
    pageContext.res?.clearCookie("session")
    return { success: true }
}

export async function getCurrentUser(pageContext: PageContextServer) {
    const sessionCookie = pageContext.req?.cookies?.session

    if (!sessionCookie) {
        return null
    }

    try {
        const session = JSON.parse(sessionCookie)

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                email: true,
                username: true,
                money: true,
                starterPokemon: true
            }
        })

        return user
    } catch {
        return null
    }
}

type RegisterInput = {
    email: string
    password: string
    trainerName: string
    starter: "arcko" | "poussifeu" | "gobou"
}

type RegisterResponse =
    | { success: true; id: string; user: string }
    | { success: false; error: string }

export async function registerAction(
    data: RegisterInput,
    pageContext: PageContextServer
): Promise<RegisterResponse> {
    try {
        console.log("[Register] Starting registration process", { 
            email: data.email, 
            trainerName: data.trainerName,
            starter: data.starter 
        })
        console.log("[Register] PageContext:", { hasReq: !!pageContext.req, hasRes: !!pageContext.res })

        const validateData = registerSchema.safeParse(data)

        if (!validateData.success) {
            const firstError = validateData.error.issues[0]
            console.log("[Register] Validation failed:", firstError)
            return {
                success: false,
                error: firstError.message
            }
        }

        const { email, password, trainerName, starter } = validateData.data
        console.log("[Register] Data validated successfully")

        const existingUserByEmail = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUserByEmail) {
            console.log("[Register] Email already exists")
            return {
                success: false,
                error: "Cet email est déjà utilisé"
            }
        }

        const existingUserByUsername = await prisma.user.findUnique({
            where: { username: trainerName }
        })

        if (existingUserByUsername) {
            console.log("[Register] Username already exists")
            return {
                success: false,
                error: "Ce nom de dresseur est déjà pris"
            }
        }

        console.log("[Register] Email and username available, hashing password...")

        const hashedPassword = await bcrypt.hash(password, 10)
        console.log("[Register] Password hashed successfully")

        console.log("[Register] Creating user in database...")
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username: trainerName,
                starterPokemon: starter,
                money: 3000
            }
        })

        console.log("[Register] User created successfully:", { 
            id: user.id, 
            username: user.username,
            email: user.email,
            money: user.money,
            starterPokemon: user.starterPokemon
        })

        const sessionCookie = {
            userId: user.id,
            email: user.email
        }

        console.log("[Register] Setting cookie...")
        pageContext.res?.cookie("session", JSON.stringify(sessionCookie), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7 * 1000,
            path: "/"
        })

        console.log("[Register] Registration successful!")

        return {
            success: true,
            id: user.id,
            user: user.username
        }

    } catch (e) {
        console.error("[Register] Error during registration:", e)

        return {
            success: false,
            error: "Une erreur est survenue lors de l'inscription"
        }
    }
}