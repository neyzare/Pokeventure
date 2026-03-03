import type {
  CombatPokemonStats,
  CombatState,
  Move,
  CombatAction,
} from "@/type/combat";

const TYPE_EFFECTIVENESS: Record<string, string[]> = {
  fire: ["grass", "ice", "bug"],
  water: ["fire", "ground", "rock"],
  grass: ["water", "ground", "rock"],
  electric: ["water", "flying"],
  ice: ["grass", "ground", "flying", "dragon"],
  fighting: ["normal", "ice", "rock", "dark"],
  poison: ["grass", "fairy"],
  ground: ["fire", "electric", "poison", "rock"],
  flying: ["grass", "fighting", "bug"],
  psychic: ["fighting", "poison"],
  bug: ["grass", "psychic", "dark"],
  rock: ["fire", "ice", "flying", "bug"],
  ghost: ["psychic", "ghost"],
  dragon: ["dragon"],
  dark: ["psychic", "ghost"],
  steel: ["ice", "rock", "fairy"],
  fairy: ["fighting", "dragon", "dark"],
};

const WILD_POKEMON = [
  263, 265, 270, 273, 276, 278, 280, 283, 285, 290, 293, 296, 300, 304, 307,
  309, 311, 312, 315, 318, 320, 322, 325, 328, 331, 333, 335, 336, 339, 341,
];

const BASIC_MOVES: Move[] = [
  { name: "Charge", type: "normal", power: 30 },
  { name: "Vive-Attaque", type: "normal", power: 20 },
  { name: "Griffe", type: "normal", power: 20 },
  { name: "Morsure", type: "dark", power: 30 },
];

function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isEffective(moveType: string, defenderTypes: string[]): number {
  const effective = TYPE_EFFECTIVENESS[moveType] || [];
  for (const defType of defenderTypes) {
    if (effective.includes(defType)) return 2;
  }
  return 1;
}

export async function buildCombatPokemon(
  pokemonId: number,
  level: number
): Promise<CombatPokemonStats> {
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
  );
  const data = await res.json();

  const types = data.types.map((t: { type: { name: string } }) => t.type.name);
  const baseHp =
    data.stats.find((s: { stat: { name: string } }) => s.stat.name === "hp")
      ?.base_stat || 50;
  const baseAtk =
    data.stats.find(
      (s: { stat: { name: string } }) => s.stat.name === "attack"
    )?.base_stat || 50;
  const baseDef =
    data.stats.find(
      (s: { stat: { name: string } }) => s.stat.name === "defense"
    )?.base_stat || 50;

  const hp = Math.floor((baseHp * level) / 10) + 20;
  const attack = Math.floor((baseAtk * level) / 15) + 10;
  const defense = Math.floor((baseDef * level) / 15) + 5;

  return {
    id: pokemonId,
    name: data.name,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
    types,
    level,
    hp,
    maxHp: hp,
    attack,
    defense,
  };
}

export async function buildMoves(pokemonId: number): Promise<Move[]> {
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
  );
  const data = await res.json();

  const typeMoves: Move[] = [];
  for (const type of data.types.map(
    (t: { type: { name: string } }) => t.type.name
  )) {
    if (type === "fire") typeMoves.push({ name: "Flammèche", type: "fire", power: 40 });
    if (type === "water") typeMoves.push({ name: "Pistolet à O", type: "water", power: 40 });
    if (type === "grass") typeMoves.push({ name: "Fouet Lianes", type: "grass", power: 45 });
    if (type === "electric") typeMoves.push({ name: "Éclair", type: "electric", power: 40 });
    if (type === "psychic") typeMoves.push({ name: "Choc Mental", type: "psychic", power: 50 });
    if (type === "fighting") typeMoves.push({ name: "Poing-Karaté", type: "fighting", power: 50 });
    if (type === "poison") typeMoves.push({ name: "Dard-Venin", type: "poison", power: 35 });
    if (type === "ground") typeMoves.push({ name: "Jet de Sable", type: "ground", power: 40 });
    if (type === "flying") typeMoves.push({ name: "Picpic", type: "flying", power: 35 });
    if (type === "bug") typeMoves.push({ name: "Piqûre", type: "bug", power: 60 });
    if (type === "rock") typeMoves.push({ name: "Jet-Pierres", type: "rock", power: 50 });
    if (type === "ghost") typeMoves.push({ name: "Léchouille", type: "ghost", power: 30 });
    if (type === "ice") typeMoves.push({ name: "Poudreuse", type: "ice", power: 40 });
    if (type === "dragon") typeMoves.push({ name: "Draco-Rage", type: "dragon", power: 40 });
    if (type === "dark") typeMoves.push({ name: "Morsure", type: "dark", power: 60 });
    if (type === "steel") typeMoves.push({ name: "Griffe Acier", type: "steel", power: 50 });
    if (type === "fairy") typeMoves.push({ name: "Vent Féérique", type: "fairy", power: 40 });
  }

  while (typeMoves.length < 4) {
    typeMoves.push(BASIC_MOVES[random(0, BASIC_MOVES.length - 1)]);
  }

  return typeMoves.slice(0, 4);
}

function calculateDamage(
  attacker: CombatPokemonStats,
  defender: CombatPokemonStats,
  move: Move
): number {
  const effectiveness = isEffective(move.type, defender.types);
  const damage =
    Math.floor((move.power * attacker.attack) / defender.defense) *
    effectiveness;
  return Math.max(1, damage);
}

export function playTurn(state: CombatState, action: CombatAction): void {
  if (action.type === "catch") {
    const hpRatio = state.opponent.hp / state.opponent.maxHp;
    const catchRate =
      hpRatio < 0.25 ? 0.55 : hpRatio < 0.5 ? 0.35 : 0.2;

    if (Math.random() < catchRate) {
      state.messages.push(`${state.opponent.name} a été capturé !`);
      state.status = "caught";
    } else {
      state.messages.push("Oh non ! La Poké Ball manque !");
      const oppMove =
        state.opponentMoves[random(0, state.opponentMoves.length - 1)];
      const damage = calculateDamage(state.opponent, state.player, oppMove);
      state.player.hp -= damage;
      state.messages.push(
        `${state.opponent.name} utilise ${oppMove.name} (-${damage} HP)`
      );
      if (state.player.hp <= 0) {
        state.player.hp = 0;
        state.messages.push("Vous avez perdu...");
        state.status = "lost";
      }
    }
    state.turn++;
    return;
  }

  if (action.type === "flee") {
    if (Math.random() < 0.5) {
      state.messages.push("Vous avez fui le combat.");
      state.status = "fled";
    } else {
      state.messages.push("Impossible de fuir !");
      const oppMove =
        state.opponentMoves[random(0, state.opponentMoves.length - 1)];
      const damage = calculateDamage(state.opponent, state.player, oppMove);
      state.player.hp -= damage;
      state.messages.push(
        `${state.opponent.name} attaque avec ${oppMove.name} (-${damage} HP)`
      );

      if (state.player.hp <= 0) {
        state.player.hp = 0;
        state.messages.push("Vous avez perdu...");
        state.status = "lost";
      }
    }
    state.turn++;
    return;
  }

  const playerMove = state.playerMoves[action.moveIndex];
  const oppMove =
    state.opponentMoves[random(0, state.opponentMoves.length - 1)];

  const playerDamage = calculateDamage(
    state.player,
    state.opponent,
    playerMove
  );
  const oppDamage = calculateDamage(state.opponent, state.player, oppMove);

  state.messages.push(
    `${state.player.name} utilise ${playerMove.name} (-${playerDamage} HP)`
  );
  state.opponent.hp -= playerDamage;

  if (state.opponent.hp <= 0) {
    state.opponent.hp = 0;
    state.messages.push("Victoire !");
    state.status = "won";
    state.turn++;
    return;
  }

  state.messages.push(
    `${state.opponent.name} utilise ${oppMove.name} (-${oppDamage} HP)`
  );
  state.player.hp -= oppDamage;

  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.messages.push("Défaite...");
    state.status = "lost";
  }

  state.turn++;
}

export async function createCombatVsWild(
  playerPokemonId: number,
  wildPokemonId: number
): Promise<CombatState> {
  const playerLevel = random(5, 10);
  const opponentLevel = random(3, 10);

  const [player, opponent, playerMoves, opponentMoves] = await Promise.all([
    buildCombatPokemon(playerPokemonId, playerLevel),
    buildCombatPokemon(wildPokemonId, opponentLevel),
    buildMoves(playerPokemonId),
    buildMoves(wildPokemonId),
  ]);

  return {
    id: `${Date.now()}_${Math.random()}`,
    player,
    opponent,
    playerMoves,
    opponentMoves,
    messages: [`Un ${opponent.name} sauvage apparaît !`],
    status: "ongoing",
    turn: 1,
  };
}

export async function createCombat(
  playerPokemonId: number
): Promise<CombatState> {
  const wildId = WILD_POKEMON[random(0, WILD_POKEMON.length - 1)];
  const playerLevel = random(5, 10);
  const opponentLevel = random(3, 12);

  const [player, opponent, playerMoves, opponentMoves] = await Promise.all([
    buildCombatPokemon(playerPokemonId, playerLevel),
    buildCombatPokemon(wildId, opponentLevel),
    buildMoves(playerPokemonId),
    buildMoves(wildId),
  ]);

  return {
    id: `${Date.now()}_${Math.random()}`,
    player,
    opponent,
    playerMoves,
    opponentMoves,
    messages: [],
    status: "ongoing",
    turn: 1,
  };
}

export function calculateRewards(
  state: CombatState
): { moneyGained: number } {
  if (state.status !== "won") return { moneyGained: 0 };
  return { moneyGained: state.opponent.level * 50 };
}
