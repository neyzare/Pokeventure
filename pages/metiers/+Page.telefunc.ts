import { prisma } from "../../server/prisma"
import { getAuthenticatedUser } from "../../server/auth"
import { JOBS } from "../../type/jobs"
import type { MissionData, UserJobData } from "../../type/jobs"

export async function onGetJobData(): Promise<
    | { success: true; data: UserJobData; missions: MissionData[]; money: number }
    | { success: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    try {
        const [userRecord, missions] = await Promise.all([
            prisma.user.findUnique({ where: { id: user.id } }),
            prisma.mission.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
        ])

        if (!userRecord) return { success: false, error: "Utilisateur introuvable" }

        const level = Math.floor(userRecord.jobXp / 1000) + 1

        return {
            success: true,
            data: {
                currentJob: userRecord.job,
                jobXp: userRecord.jobXp,
                level,
            },
            missions: missions.map((m) => ({
                id: m.id,
                jobType: m.jobType,
                status: m.status as "pending" | "completed",
                reward: m.reward,
                completedAt: m.completedAt,
                createdAt: m.createdAt,
            })),
            money: userRecord.money,
        }
    } catch (error) {
        console.error("[JOBS]", error)
        return { success: false, error: "Erreur" }
    }
}

export async function onChooseJob(jobId: string): Promise<
    | { success: true }
    | { success: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    if (!JOBS[jobId]) return { success: false, error: "Métier invalide" }

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { job: jobId },
        })

        return { success: true }
    } catch (error) {
        console.error("[JOBS]", error)
        return { success: false, error: "Erreur" }
    }
}

export async function onStartMission(): Promise<
    | { success: true; mission: MissionData }
    | { success: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    try {
        const userRecord = await prisma.user.findUnique({ where: { id: user.id } })
        if (!userRecord || !userRecord.job) return { success: false, error: "Aucun métier choisi" }

        const pending = await prisma.mission.count({
            where: { userId: user.id, status: "pending" },
        })

        if (pending > 0) return { success: false, error: "Mission déjà en cours" }

        const job = JOBS[userRecord.job]
        if (!job) return { success: false, error: "Métier invalide" }

        const level = Math.floor(userRecord.jobXp / 1000) + 1
        const reward = Math.floor(job.baseReward * (1 + level * 0.1))

        const mission = await prisma.mission.create({
            data: {
                userId: user.id,
                jobType: userRecord.job,
                status: "pending",
                reward,
            },
        })

        return {
            success: true,
            mission: {
                id: mission.id,
                jobType: mission.jobType,
                status: "pending",
                reward: mission.reward,
                completedAt: null,
                createdAt: mission.createdAt,
            },
        }
    } catch (error) {
        console.error("[JOBS]", error)
        return { success: false, error: "Erreur" }
    }
}

export async function onCompleteMission(missionId: string): Promise<
    | { success: true; reward: number; xpGained: number }
    | { success: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    try {
        const mission = await prisma.mission.findUnique({ where: { id: missionId } })

        if (!mission) return { success: false, error: "Mission introuvable" }
        if (mission.userId !== user.id) return { success: false, error: "Mission non autorisée" }
        if (mission.status !== "pending") return { success: false, error: "Mission déjà terminée" }

        const timeElapsed = Date.now() - mission.createdAt.getTime()
        const job = JOBS[mission.jobType]
        if (!job) return { success: false, error: "Métier invalide" }

        const requiredTime = job.duration * 1000

        if (timeElapsed < requiredTime) {
            return { success: false, error: `Attendre ${Math.ceil((requiredTime - timeElapsed) / 1000)}s` }
        }

        const xpGained = 100

        await prisma.$transaction([
            prisma.mission.update({
                where: { id: missionId },
                data: { status: "completed", completedAt: new Date() },
            }),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    money: { increment: mission.reward },
                    jobXp: { increment: xpGained },
                },
            }),
        ])

        return { success: true, reward: mission.reward, xpGained }
    } catch (error) {
        console.error("[JOBS]", error)
        return { success: false, error: "Erreur" }
    }
}
