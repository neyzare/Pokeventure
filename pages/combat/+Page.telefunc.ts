import { prisma } from "../../server/prisma"
import { getAuthenticatedUser } from "../../server/auth"
import { createCombat, playTurn, calculateRewards } from "../../server/combat"
import type { CombatState, CombatAction, CombatResult } from "../../type/combat"

const activeCombats = new Map<string, CombatState>()

export async function onStartCombat(playerPokemonId: number): Promise<
    | { success: true; combat: CombatState }
    | { success: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) {
        return { success: false, error: "Vous devez être connecté" }
    }

    const owned = await prisma.pokedex.findFirst({
        where: { userId: user.id, pokemonId: playerPokemonId },
    })

    if (!owned) {
        return { success: false, error: "Vous ne possédez pas ce Pokémon" }
    }

    try {
        const combat = await createCombat(playerPokemonId)
        activeCombats.set(user.id, combat)
        return { success: true, combat }
    } catch (error) {
        console.error("[COMBAT]", error)
        return { success: false, error: "Erreur lors du lancement du combat" }
    }
}

export async function onPlayTurn(action: CombatAction): Promise<
    | { success: true; combat: CombatState }
    | { success: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    const combat = activeCombats.get(user.id)
    if (!combat) return { success: false, error: "Aucun combat en cours" }
    if (combat.status !== "ongoing") return { success: false, error: "Combat terminé" }

    try {
        playTurn(combat, action)

        if (combat.status !== "ongoing") {
            const rewards = calculateRewards(combat)

            await prisma.combat.create({
                data: {
                    userId: user.id,
                    playerPokemonId: combat.player.id,
                    opponentPokemonId: combat.opponent.id,
                    result: combat.status,
                    turns: combat.turn,
                    moneyGained: rewards.moneyGained,
                },
            })

            if (combat.status === "won") {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { money: { increment: rewards.moneyGained } },
                })

                await prisma.pokedex.upsert({
                    where: {
                        userId_pokemonId: {
                            userId: user.id,
                            pokemonId: combat.opponent.id,
                        },
                    },
                    create: { userId: user.id, pokemonId: combat.opponent.id },
                    update: {},
                })
            }

            activeCombats.delete(user.id)
        }

        return { success: true, combat }
    } catch (error) {
        console.error("[COMBAT]", error)
        return { success: false, error: "Erreur" }
    }
}

export async function onGetMyPokemon(): Promise<
    | { success: true; pokemon: { pokemonId: number; name: string; sprite: string }[] }
    | { success: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    try {
        const pokedex = await prisma.pokedex.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "asc" },
        })

        return {
            success: true,
            pokemon: pokedex.map((p) => ({
                pokemonId: p.pokemonId,
                name: `Pokemon #${p.pokemonId}`,
                sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`,
            })),
        }
    } catch (error) {
        console.error("[COMBAT]", error)
        return { success: false, error: "Erreur" }
    }
}

export async function onGetCombatHistory(): Promise<
    | { success: true; combats: CombatResult[] }
    | { success: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    try {
        const combats = await prisma.combat.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        })

        return {
            success: true,
            combats: combats.map((c) => ({
                combatId: c.id,
                result: c.result as "won" | "lost" | "fled",
                moneyGained: c.moneyGained,
                turns: c.turns,
                opponentName: `Pokemon #${c.opponentPokemonId}`,
                opponentId: c.opponentPokemonId,
            })),
        }
    } catch (error) {
        console.error("[COMBAT]", error)
        return { success: false, error: "Erreur" }
    }
}
