export type Zone = {
    id: string
    name: string
    description: string
    icon: string
    duration: number
    moneyMin: number
    moneyMax: number
    pokemon: number[]
}

export const ZONES: Record<string, Zone> = {
    forest: {
        id: "forest",
        name: "Forêt de Mûria",
        description: "Une forêt dense peuplée de Pokémon de type Plante et Insecte.",
        icon: "🌲",
        duration: 15,
        moneyMin: 50,
        moneyMax: 150,
        pokemon: [252, 253, 254, 265, 266, 267, 268, 269, 285, 286, 315, 331, 333, 345],
    },
    cave: {
        id: "cave",
        name: "Grotte Obscure",
        description: "Un réseau de grottes sombres. On y croise des Pokémon de type Roche et Sol.",
        icon: "🪨",
        duration: 20,
        moneyMin: 80,
        moneyMax: 200,
        pokemon: [304, 305, 306, 307, 308, 328, 329, 330, 339, 340, 341, 342, 347, 348],
    },
    ocean: {
        id: "ocean",
        name: "Mer Azurée",
        description: "Un vaste océan tropical. Idéal pour rencontrer des Pokémon de type Eau.",
        icon: "🌊",
        duration: 25,
        moneyMin: 100,
        moneyMax: 250,
        pokemon: [270, 271, 272, 278, 279, 283, 284, 318, 319, 320, 321, 339, 340, 349, 350],
    },
    volcano: {
        id: "volcano",
        name: "Mont Cendreux",
        description: "Les abords d'un volcan actif. Des Pokémon de type Feu y vivent.",
        icon: "🌋",
        duration: 30,
        moneyMin: 150,
        moneyMax: 300,
        pokemon: [322, 323, 296, 297, 309, 310, 324, 335, 336],
    },
    sky: {
        id: "sky",
        name: "Ciel des Sommets",
        description: "Les hauteurs venteuses où planent les Pokémon de type Vol.",
        icon: "☁️",
        duration: 20,
        moneyMin: 80,
        moneyMax: 180,
        pokemon: [276, 277, 278, 279, 290, 291, 292, 333, 334, 335],
    },
    ruins: {
        id: "ruins",
        name: "Ruines Antiques",
        description: "D'anciennes ruines mystérieuses. On y trouve des Pokémon rares.",
        icon: "🏛️",
        duration: 40,
        moneyMin: 200,
        moneyMax: 400,
        pokemon: [343, 344, 345, 346, 347, 348, 353, 354, 355, 356, 360, 361, 362],
    },
}

export type ExplorationRecord = {
    id: string
    zone: string
    status: "ongoing" | "done"
    foundPokemon: number[]
    moneyFound: number
    startedAt: Date
    finishedAt: Date | null
}
