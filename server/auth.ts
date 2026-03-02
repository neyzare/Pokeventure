import { getContext } from "telefunc"
import { prisma } from "./prisma"
import type { Request } from "express"
import cookie from "cookie"
import argon2 from "argon2"

type TelefuncContext = {
    req?: Request
}

function readCookie(req?: Request, name = "session") {
    const header = req?.headers?.cookie ?? ""
    const parsed = cookie.parse(header)
    return parsed[name] ?? null
}

export async function getAuthenticatedUser(): Promise<{ id: string; username: string | null } | null> {
    const { req } = getContext<TelefuncContext>()
    
    const rawSession = readCookie(req, "session")
    if (!rawSession) return null

    const [tokenId, token] = rawSession.split(".")
    if (!tokenId || !token) return null

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
    })

    if (!user || !user.sessionTokenHash) return null

    const ok = await argon2.verify(user.sessionTokenHash, token)
    if (!ok) return null

    return { id: user.id, username: user.username }
}
