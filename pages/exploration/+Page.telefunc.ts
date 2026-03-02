import { prisma } from "../../server/prisma"
import { getAuthenticatedUser } from "../../server/auth"
import { createCombatVsWild, playTurn } from "../../server/combat"
import type { CombatState, CombatAction } from "../../type/combat"

const activeCombats = new Map<string, CombatState>()

export async function onGetTeam(): Promise<
    | { success: true; team: { pokemonId: number; name: string; sprite: string }[] }
    | { success: false; error: string }
> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    const pokedex = await prisma.pokedex.findMany({
        where: { userId: user.id },
        take: 6,
        orderBy: { createdAt: "asc" },
    })

    if (pokedex.length === 0) return { success: false, error: "Vous n'avez pas encore de Pokémon" }

    const team = await Promise.all(
        pokedex.map(async (p) => {
            try {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.pokemonId}`)
                const data = await res.json()
                const name = (data.name as string).charAt(0).toUpperCase() + (data.name as string).slice(1)
                return {
                    pokemonId: p.pokemonId,
                    name,
                    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`,
                }
            } catch {
                return {
                    pokemonId: p.pokemonId,
                    name: `#${p.pokemonId}`,
                    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`,
                }
            }
        })
    )

    return { success: true, team }
}

export async function onStartWildEncounter(
    playerPokemonId: number,
    wildPokemonId: number
): Promise<{ success: true; combat: CombatState } | { success: false; error: string }> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    const combat = await createCombatVsWild(playerPokemonId, wildPokemonId)
    activeCombats.set(user.id, combat)

    return { success: true, combat }
}

export async function onPlayWildTurn(
    action: CombatAction
): Promise<{ success: true; combat: CombatState; caught: boolean } | { success: false; error: string }> {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: "Non connecté" }

    const combat = activeCombats.get(user.id)
    if (!combat) return { success: false, error: "Pas de combat en cours" }
    if (combat.status !== "ongoing") return { success: false, error: "Combat déjà terminé" }

    playTurn(combat, action)

    if (combat.status === "caught") {
        activeCombats.delete(user.id)
        const existing = await prisma.pokedex.findUnique({
            where: { userId_pokemonId: { userId: user.id, pokemonId: combat.opponent.id } },
        })
        if (!existing) {
            await prisma.pokedex.create({
                data: { userId: user.id, pokemonId: combat.opponent.id },
            })
        }
        return { success: true, combat, caught: true }
    }

    if (combat.status !== "ongoing") {
        activeCombats.delete(user.id)
    }

    return { success: true, combat, caught: false }
}
