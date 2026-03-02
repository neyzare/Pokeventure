export type CombatPokemonStats = {
    id: number
    name: string
    sprite: string
    types: string[]
    level: number
    hp: number
    maxHp: number
    attack: number
    defense: number
}

export type Move = {
    name: string
    type: string
    power: number
}

export type CombatAction =
    | { type: "attack"; moveIndex: number }
    | { type: "flee" }
    | { type: "catch" }

export type CombatState = {
    id: string
    player: CombatPokemonStats
    opponent: CombatPokemonStats
    playerMoves: Move[]
    opponentMoves: Move[]
    messages: string[]
    status: "ongoing" | "won" | "lost" | "fled" | "caught"
    turn: number
}

export type CombatResult = {
    combatId: string
    result: "won" | "lost" | "fled"
    moneyGained: number
    turns: number
    opponentName: string
    opponentId: number
}
