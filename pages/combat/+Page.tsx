import { useState, useEffect } from "react"
import { onStartCombat, onPlayTurn, onGetMyPokemon, onGetCombatHistory } from "./+Page.telefunc"
import type { CombatState, CombatResult, Move } from "../../type/combat"

type MyPokemon = { pokemonId: number; name: string; sprite: string }

export default function Combat() {
    const [view, setView] = useState<"menu" | "select" | "battle">("menu")
    const [myPokemon, setMyPokemon] = useState<MyPokemon[]>([])
    const [combat, setCombat] = useState<CombatState | null>(null)
    const [history, setHistory] = useState<CombatResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        onGetCombatHistory().then((res) => {
            if (res.success) setHistory(res.combats)
        })
    }, [])

    const startSelection = async () => {
        setLoading(true)
        const res = await onGetMyPokemon()
        setLoading(false)
        if (res.success) {
            setMyPokemon(res.pokemon)
            setView("select")
        } else {
            setError(res.error)
        }
    }

    const selectPokemon = async (pokemonId: number) => {
        setLoading(true)
        const res = await onStartCombat(pokemonId)
        setLoading(false)
        if (res.success) {
            setCombat(res.combat)
            setView("battle")
        } else {
            setError(res.error)
        }
    }

    const endCombat = () => {
        onGetCombatHistory().then((res) => {
            if (res.success) setHistory(res.combats)
        })
        setCombat(null)
        setView("menu")
    }

    return (
        <main className="p-6">
            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {view === "menu" && <MenuView onStart={startSelection} history={history} loading={loading} />}
            {view === "select" && <SelectView pokemon={myPokemon} onSelect={selectPokemon} onBack={() => setView("menu")} loading={loading} />}
            {view === "battle" && combat && <BattleView combat={combat} setCombat={setCombat} onEnd={endCombat} />}
        </main>
    )
}

function MenuView({ onStart, history, loading }: { onStart: () => void; history: CombatResult[]; loading: boolean }) {
    return (
        <div>
            <h1 className="text-3xl font-medium mb-6 text-center uppercase">Poké - Combat</h1>
            <div className="flex justify-center mb-10">
                <button
                    type="button"
                    onClick={onStart}
                    disabled={loading}
                    className="rounded-xl border bg-blue-900 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-950 disabled:opacity-50"
                >
                    {loading ? "Chargement..." : "Lancer un combat"}
                </button>
            </div>

            <div className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Historique</h2>
                </div>
                {history.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-slate-500">Aucun combat</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {history.map((c) => (
                            <div key={c.combatId} className="flex items-center gap-4 px-6 py-3">
                                <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${c.opponentId}.png`} alt="" className="w-10 h-10" />
                                <div className="flex-1">
                                    <span className="text-sm font-semibold">{c.opponentName}</span>
                                    <span className="text-xs text-slate-500 ml-2">{c.turns} tours</span>
                                </div>
                                <div className="flex gap-3">
                                    {c.moneyGained > 0 && <span className="text-xs">+{c.moneyGained} ₽</span>}
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                        c.result === "won" ? "bg-green-50 text-green-700" : c.result === "lost" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                                    }`}>
                                        {c.result === "won" ? "Victoire" : c.result === "lost" ? "Défaite" : "Fuite"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function SelectView({ pokemon, onSelect, onBack, loading }: { pokemon: MyPokemon[]; onSelect: (id: number) => void; onBack: () => void; loading: boolean }) {
    return (
        <div>
            <button type="button" className="mb-6 text-sm font-semibold text-slate-600 hover:text-slate-900" onClick={onBack}>
                <i className="fa-solid fa-arrow-left mr-2" /> Retour
            </button>
            <h1 className="text-3xl font-medium mb-8 text-center uppercase">Choisissez votre Pokémon</h1>

            {pokemon.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                    Aucun Pokémon
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
                    {pokemon.map((p) => (
                        <button
                            type="button"
                            key={p.pokemonId}
                            className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md p-4 flex flex-col items-center gap-2 disabled:opacity-50"
                            onClick={() => onSelect(p.pokemonId)}
                            disabled={loading}
                        >
                            <img src={p.sprite} alt="" className="w-16 h-16" />
                            <span className="text-xs font-semibold">#{p.pokemonId}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function BattleView({ combat, setCombat, onEnd }: { combat: CombatState; setCombat: (c: CombatState) => void; onEnd: () => void }) {
    const [loading, setLoading] = useState(false)

    const attack = async (moveIndex: number) => {
        if (loading || combat.status !== "ongoing") return
        setLoading(true)
        const res = await onPlayTurn({ type: "attack", moveIndex })
        setLoading(false)
        if (res.success) setCombat(res.combat)
    }

    const flee = async () => {
        if (loading || combat.status !== "ongoing") return
        setLoading(true)
        const res = await onPlayTurn({ type: "flee" })
        setLoading(false)
        if (res.success) setCombat(res.combat)
    }

    const isOver = combat.status !== "ongoing"

    return (
        <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="bg-slate-50 p-6">
                    <div className="flex justify-between items-start mb-8">
                        <div />
                        <div className="flex flex-col items-end gap-2">
                            <HpBar name={combat.opponent.name} level={combat.opponent.level} hp={combat.opponent.hp} maxHp={combat.opponent.maxHp} />
                            <img src={combat.opponent.sprite} alt="" className="w-24 h-24" />
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col items-start gap-2">
                            <img src={combat.player.sprite} alt="" className="w-24 h-24 scale-x-[-1]" />
                            <HpBar name={combat.player.name} level={combat.player.level} hp={combat.player.hp} maxHp={combat.player.maxHp} showText />
                        </div>
                        <div />
                    </div>
                </div>

                <div className="border-t border-slate-200 px-6 py-4 h-28 overflow-y-auto">
                    {combat.messages.length === 0 ? (
                        <p className="text-sm text-slate-500">Un <span className="capitalize font-medium">{combat.opponent.name}</span> sauvage apparaît !</p>
                    ) : (
                        combat.messages.map((msg, i) => <p key={i} className="text-sm mb-1">{msg}</p>)
                    )}
                </div>

                <div className="border-t border-slate-200 p-4">
                    {isOver ? (
                        <div className="text-center py-2">
                            <p className={`text-lg font-semibold mb-4 ${combat.status === "won" ? "text-green-700" : combat.status === "lost" ? "text-red-700" : "text-amber-700"}`}>
                                {combat.status === "won" ? "Victoire !" : combat.status === "lost" ? "Défaite" : "Fuite"}
                            </p>
                            <button type="button" onClick={onEnd} className="rounded-xl border bg-blue-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-950">
                                Retour
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {combat.playerMoves.map((move, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`rounded-xl border px-3 py-2.5 text-left disabled:opacity-50 ${getMoveStyle(move.type)}`}
                                        onClick={() => attack(i)}
                                        disabled={loading}
                                    >
                                        <div className="text-sm font-semibold capitalize">{move.name}</div>
                                        <div className="text-xs opacity-70">{move.power} puiss.</div>
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={flee}
                                disabled={loading}
                            >
                                Fuir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function HpBar({ name, level, hp, maxHp, showText = false }: { name: string; level: number; hp: number; maxHp: number; showText?: boolean }) {
    const percent = Math.max(0, (hp / maxHp) * 100)
    const color = percent > 50 ? "bg-green-500" : percent > 20 ? "bg-amber-500" : "bg-red-500"

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm min-w-[180px]">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold capitalize">{name}</span>
                <span className="text-xs text-slate-500">Nv.{level}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-300 ${color}`} style={{ width: `${percent}%` }} />
            </div>
            {showText && <div className="text-right text-xs mt-1 text-slate-500">{hp} / {maxHp}</div>}
        </div>
    )
}

function getMoveStyle(type: string): string {
    const styles: Record<string, string> = {
        fire: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
        water: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
        grass: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100",
        electric: "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
        normal: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
        fighting: "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100",
        poison: "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100",
        psychic: "border-pink-200 bg-pink-50 text-pink-800 hover:bg-pink-100",
        bug: "border-lime-200 bg-lime-50 text-lime-800 hover:bg-lime-100",
        rock: "border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100",
        ghost: "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100",
        ice: "border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100",
        dragon: "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
        dark: "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200",
        flying: "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
        ground: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
        steel: "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100",
        fairy: "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100",
    }
    return styles[type] || styles.normal
}
