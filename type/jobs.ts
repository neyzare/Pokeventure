export type Job = {
    id: string
    name: string
    description: string
    baseReward: number
    duration: number
    icon: string
}

export const JOBS: Record<string, Job> = {
    delivery: {
        id: "delivery",
        name: "Livreur",
        description: "Livrer des colis en ville",
        baseReward: 150,
        duration: 5,
        icon: "📦",
    },
    fishing: {
        id: "fishing",
        name: "Pêcheur",
        description: "Pêcher des Pokémon aquatiques",
        baseReward: 200,
        duration: 8,
        icon: "🎣",
    },
    mining: {
        id: "mining",
        name: "Mineur",
        description: "Extraire des pierres précieuses",
        baseReward: 250,
        duration: 10,
        icon: "⛏️",
    },
    guard: {
        id: "guard",
        name: "Garde",
        description: "Protéger des bâtiments",
        baseReward: 180,
        duration: 6,
        icon: "🛡️",
    },
    farmer: {
        id: "farmer",
        name: "Fermier",
        description: "Cultiver des baies",
        baseReward: 120,
        duration: 4,
        icon: "🌾",
    },
}

export type MissionData = {
    id: string
    jobType: string
    status: "pending" | "completed"
    reward: number
    completedAt: Date | null
    createdAt: Date
}

export type UserJobData = {
    currentJob: string | null
    jobXp: number
    level: number
}
