"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getTeamAction,
  startWildEncounterAction,
  playWildTurnAction,
} from "@/app/actions/exploration";
import type { CombatState, CombatAction } from "@/type/combat";

const P = 0;
const G = 1;
const T = 2;
const W = 3;
const B = 4;
const S = 5;

const MAP_W = 50;
const MAP_H = 38;
const TILE_SIZE = 40;
const VIEW_W = 15;
const VIEW_H = 11;

const TILE_BG: Record<number, string> = {
  0: "#e5d5a0",
  1: "#3a9e3a",
  2: "#1a5c1a",
  3: "#3b82f6",
  4: "#78716c",
  5: "#fef08a",
};

const ZONE_POKEMON: Record<string, number[]> = {
  route: [263, 265, 276, 280, 293, 300, 311, 312],
  forest: [267, 285, 290, 315, 331, 333, 283, 265],
  ruins: [343, 353, 354, 355, 361, 360, 354, 353],
};

function makeMap(): number[][] {
  const m: number[][] = Array.from({ length: MAP_H }, () =>
    Array(MAP_W).fill(T)
  );
  const fill = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tile: number
  ) => {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) m[y][x] = tile;
  };

  fill(3, 3, 18, 18, P);
  fill(4, 4, 7, 6, B);
  fill(9, 4, 12, 6, B);
  fill(14, 4, 17, 6, B);
  fill(4, 8, 7, 10, B);
  fill(9, 8, 12, 10, B);
  fill(14, 9, 17, 11, B);

  fill(18, 8, 47, 10, P);
  fill(18, 6, 47, 7, G);
  fill(18, 11, 47, 12, G);
  fill(18, 5, 47, 5, T);
  fill(18, 13, 47, 13, T);

  fill(21, 14, 48, 28, G);
  fill(22, 15, 25, 17, T);
  fill(28, 15, 32, 17, T);
  fill(35, 14, 38, 16, T);
  fill(42, 15, 46, 17, T);
  fill(22, 20, 26, 22, T);
  fill(30, 19, 34, 21, T);
  fill(37, 20, 41, 22, T);
  fill(44, 20, 47, 23, T);
  fill(22, 25, 26, 27, T);
  fill(31, 24, 35, 26, T);
  fill(39, 25, 43, 27, T);
  fill(21, 10, 21, 14, P);
  fill(21, 14, 48, 14, P);

  fill(8, 18, 10, 36, P);
  fill(6, 18, 7, 36, G);
  fill(11, 18, 12, 36, G);
  fill(5, 18, 5, 36, T);
  fill(13, 18, 13, 36, T);

  fill(2, 18, 7, 22, P);
  fill(2, 18, 2, 22, G);
  fill(7, 18, 7, 22, G);
  fill(2, 22, 6, 36, P);
  fill(3, 25, 5, 28, G);
  fill(3, 31, 5, 35, G);
  m[22][2] = B;
  m[22][4] = B;
  m[22][6] = B;
  m[29][2] = B;
  m[29][6] = B;
  m[36][2] = B;
  m[36][4] = B;
  m[36][6] = B;

  fill(16, 29, 48, 37, W);
  fill(16, 27, 48, 28, S);
  fill(14, 27, 15, 37, S);
  fill(8, 29, 13, 31, P);

  return m;
}

const MAP = makeMap();

function getZone(x: number, y: number): string {
  if (x >= 21 && y >= 14 && y <= 28) return "forest";
  if (x >= 2 && x <= 6 && y >= 22 && y <= 36) return "ruins";
  return "route";
}

function pickPokemon(x: number, y: number): number {
  const pool = ZONE_POKEMON[getZone(x, y)] ?? ZONE_POKEMON.route;
  return pool[Math.floor(Math.random() * pool.length)];
}

const ZONE_LABELS: Record<string, string> = {
  route: "🗺️ Route",
  forest: "🌲 Forêt",
  ruins: "🏛️ Ruines",
};

type TeamMember = { pokemonId: number; name: string; sprite: string };
type WildInfo = { pokemonId: number; name: string };
type Mode = "map" | "selecting" | "fighting";

function HpBar({
  hp,
  maxHp,
  color,
}: {
  hp: number;
  maxHp: number;
  color: string;
}) {
  const pct = Math.round((hp / maxHp) * 100);
  return (
    <div className="w-full">
      <div className="w-full bg-base-300 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs mt-0.5">
        {hp} / {maxHp}
      </div>
    </div>
  );
}

export default function Exploration() {
  const [mode, setMode] = useState<Mode>("map");
  const [pos, setPos] = useState({ x: 10, y: 14 });
  const [steps, setSteps] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const cooldown = useRef(false);

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamError, setTeamError] = useState<string | null>(null);

  const [wildInfo, setWildInfo] = useState<WildInfo | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [acting, setActing] = useState(false);
  const [startingCombat, setStartingCombat] = useState(false);

  const showMsg = (msg: string, ms = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), ms);
  };

  useEffect(() => {
    getTeamAction().then((res) => {
      if (res.success) setTeam(res.team);
      else setTeamError(res.error);
    });
  }, []);

  useEffect(() => {
    if (mode !== "map") return;
    const tile = MAP[pos.y]?.[pos.x];
    if (tile !== G) return;
    if (Math.random() > 0.15) return;

    const pokemonId = pickPokemon(pos.x, pos.y);
    fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
      .then((r) => r.json())
      .then((d) => {
        const name =
          (d.name as string).charAt(0).toUpperCase() +
          (d.name as string).slice(1);
        setWildInfo({ pokemonId, name });
        setMode("selecting");
      })
      .catch(() => {
        setWildInfo({ pokemonId, name: `#${pokemonId}` });
        setMode("selecting");
      });
  }, [pos, mode]);

  const move = useCallback((dx: number, dy: number) => {
    if (mode !== "map" || cooldown.current) return;
    cooldown.current = true;
    setTimeout(() => {
      cooldown.current = false;
    }, 130);

    setPos((prev) => {
      const nx = prev.x + dx;
      const ny = prev.y + dy;
      const tile = MAP[ny]?.[nx];
      if (tile === undefined || tile === T || tile === W || tile === B)
        return prev;
      setSteps((s) => s + 1);
      return { x: nx, y: ny };
    });
  }, [mode]);

  useEffect(() => {
    const keys: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      w: [0, -1],
      ArrowDown: [0, 1],
      s: [0, 1],
      ArrowLeft: [-1, 0],
      a: [-1, 0],
      ArrowRight: [1, 0],
      d: [1, 0],
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = keys[e.key];
      if (dir) {
        e.preventDefault();
        move(dir[0], dir[1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  const startFight = async (member: TeamMember) => {
    if (!wildInfo || startingCombat) return;
    setStartingCombat(true);
    const res = await startWildEncounterAction(
      member.pokemonId,
      wildInfo.pokemonId
    );
    setStartingCombat(false);
    if (!res.success) {
      showMsg(res.error);
      setMode("map");
      return;
    }
    setCombat(res.combat);
    setMode("fighting");
  };

  const handleAction = async (action: CombatAction) => {
    if (!combat || acting) return;
    setActing(true);
    const res = await playWildTurnAction(action);
    setActing(false);
    if (!res.success) {
      showMsg(res.error);
      return;
    }
    setCombat(res.combat);

    if (res.caught) {
      showMsg(
        `✅ ${combat.opponent.name} a été capturé et ajouté à votre Pokédex !`,
        4000
      );
      setMode("map");
      setCombat(null);
      return;
    }
    if (res.combat.status !== "ongoing") {
      setTimeout(() => {
        setMode("map");
        setCombat(null);
      }, 2000);
    }
  };

  const fleeFromSelection = () => {
    showMsg("Vous avez fui !");
    setMode("map");
    setWildInfo(null);
  };

  const camX = Math.max(
    0,
    Math.min(MAP_W - VIEW_W, pos.x - Math.floor(VIEW_W / 2))
  );
  const camY = Math.max(
    0,
    Math.min(MAP_H - VIEW_H, pos.y - Math.floor(VIEW_H / 2))
  );
  const currentZone = getZone(pos.x, pos.y);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-medium uppercase">Exploration</h1>
        <div className="flex gap-2">
          <div className="badge badge-neutral badge-lg">
            {ZONE_LABELS[currentZone]}
          </div>
          <div className="badge badge-neutral badge-lg">👣 {steps}</div>
        </div>
      </div>

      {message && (
        <div className="alert mb-4">
          <span>{message}</span>
        </div>
      )}

      {mode === "map" && (
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative border-4 border-green-900 rounded-lg overflow-hidden shadow-2xl"
            style={{
              width: VIEW_W * TILE_SIZE,
              height: VIEW_H * TILE_SIZE,
            }}
          >
            {Array.from({ length: VIEW_H }, (_, vy) =>
              Array.from({ length: VIEW_W }, (_, vx) => {
                const mx = camX + vx;
                const my = camY + vy;
                const tile = MAP[my]?.[mx] ?? T;
                const isPlayer = mx === pos.x && my === pos.y;
                return (
                  <div
                    key={`${vx}-${vy}`}
                    style={{
                      position: "absolute",
                      left: vx * TILE_SIZE,
                      top: vy * TILE_SIZE,
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      backgroundColor: TILE_BG[tile],
                    }}
                  >
                    {tile === T && (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                          userSelect: "none",
                        }}
                      >
                        🌲
                      </div>
                    )}
                    {tile === G && (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "space-around",
                          padding: "0 4px 2px",
                        }}
                      >
                        <div
                          style={{
                            width: 3,
                            height: 18,
                            backgroundColor: "#1a6b1a",
                            borderRadius: 2,
                            transform: "rotate(-6deg)",
                          }}
                        />
                        <div
                          style={{
                            width: 3,
                            height: 22,
                            backgroundColor: "#2d8c2d",
                            borderRadius: 2,
                          }}
                        />
                        <div
                          style={{
                            width: 3,
                            height: 16,
                            backgroundColor: "#1a6b1a",
                            borderRadius: 2,
                            transform: "rotate(6deg)",
                          }}
                        />
                      </div>
                    )}
                    {tile === W && (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "#3b82f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#93c5fd",
                          fontSize: 18,
                        }}
                      >
                        〜
                      </div>
                    )}
                    {isPlayer && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                          zIndex: 10,
                          userSelect: "none",
                        }}
                      >
                        🧑
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              type="button"
              className="btn btn-sm btn-square"
              onClick={() => move(0, -1)}
            >
              ▲
            </button>
            <div />
            <button
              type="button"
              className="btn btn-sm btn-square"
              onClick={() => move(-1, 0)}
            >
              ◀
            </button>
            <div className="btn btn-sm btn-square btn-disabled">•</div>
            <button
              type="button"
              className="btn btn-sm btn-square"
              onClick={() => move(1, 0)}
            >
              ▶
            </button>
            <div />
            <button
              type="button"
              className="btn btn-sm btn-square"
              onClick={() => move(0, 1)}
            >
              ▼
            </button>
            <div />
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-xs text-base-content/60">
            <span>🌲 Arbre (bloquant)</span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  backgroundColor: "#3a9e3a",
                  borderRadius: 2,
                }}
              />{" "}
              Herbes hautes (Pokémon)
            </span>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  backgroundColor: "#3b82f6",
                  borderRadius: 2,
                }}
              />{" "}
              Eau (bloquant)
            </span>
            <span>Flèches / WASD pour bouger</span>
          </div>
        </div>
      )}

      {mode === "selecting" && wildInfo && (
        <div className="max-w-lg mx-auto">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${wildInfo.pokemonId}.png`}
                alt={wildInfo.name}
                className="w-32 h-32 mx-auto"
              />
              <h2 className="card-title justify-center text-2xl">
                Un {wildInfo.name} sauvage !
              </h2>
              <p className="text-base-content/60 text-sm">
                Choisissez un Pokémon pour combattre
              </p>

              {teamError ? (
                <div className="alert alert-error mt-2">
                  <span>{teamError}</span>
                </div>
              ) : team.length === 0 ? (
                <div className="flex justify-center mt-4">
                  <span className="loading loading-spinner loading-md" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {team.map((member) => (
                    <button
                      key={member.pokemonId}
                      type="button"
                      className="btn btn-outline flex flex-col h-auto py-2 gap-1"
                      onClick={() => startFight(member)}
                      disabled={startingCombat}
                    >
                      <img
                        src={member.sprite}
                        alt={member.name}
                        className="w-12 h-12"
                      />
                      <span className="text-xs capitalize">{member.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="btn btn-ghost mt-3"
                onClick={fleeFromSelection}
                disabled={startingCombat}
              >
                💨 Fuir
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "fighting" && combat && (
        <div className="max-w-xl mx-auto">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body gap-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold capitalize text-lg">
                    {combat.opponent.name}
                  </div>
                  <div className="badge badge-ghost badge-sm mb-1">
                    Nv. {combat.opponent.level}
                  </div>
                  <HpBar
                    hp={combat.opponent.hp}
                    maxHp={combat.opponent.maxHp}
                    color="bg-error"
                  />
                </div>
                <img
                  src={combat.opponent.sprite}
                  alt={combat.opponent.name}
                  className="w-28 h-28"
                />
              </div>

              <div className="divider my-0" />

              <div className="flex items-center justify-between">
                <img
                  src={combat.player.sprite}
                  alt={combat.player.name}
                  className="w-28 h-28"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="flex-1 text-right">
                  <div className="font-bold capitalize text-lg">
                    {combat.player.name}
                  </div>
                  <div className="badge badge-ghost badge-sm mb-1">
                    Nv. {combat.player.level}
                  </div>
                  <HpBar
                    hp={combat.player.hp}
                    maxHp={combat.player.maxHp}
                    color="bg-success"
                  />
                </div>
              </div>

              <div className="bg-base-200 rounded-lg p-3 text-sm min-h-10 text-center">
                {combat.messages[combat.messages.length - 1] ?? ""}
              </div>

              {combat.status === "ongoing" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {combat.playerMoves.map((move, i) => (
                      <button
                        key={i}
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          handleAction({ type: "attack", moveIndex: i })
                        }
                        disabled={acting}
                      >
                        {move.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-warning flex-1"
                      onClick={() => handleAction({ type: "catch" })}
                      disabled={acting}
                    >
                      {acting ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        "🔴 Poké Ball"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost flex-1"
                      onClick={() => handleAction({ type: "flee" })}
                      disabled={acting}
                    >
                      💨 Fuir
                    </button>
                  </div>
                  <p className="text-xs text-center text-base-content/50">
                    Taux de capture :{" "}
                    {combat.opponent.hp / combat.opponent.maxHp < 0.25
                      ? "55%"
                      : combat.opponent.hp / combat.opponent.maxHp < 0.5
                        ? "35%"
                        : "20%"}{" "}
                    — Affaiblissez le Pokémon pour augmenter les chances !
                  </p>
                </>
              )}

              {combat.status !== "ongoing" && (
                <div className="text-center font-bold text-lg">
                  {combat.status === "won" && "🏆 Victoire !"}
                  {combat.status === "lost" && "💀 Défaite..."}
                  {combat.status === "fled" && "💨 Vous avez fui"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
