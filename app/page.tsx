"use client";

import { useSession } from "@/hook/useSession";
import { useTeam } from "@/hook/useTeam";
import Link from "next/link";

export default function Page() {
  const { loading, isLoggedIn, user } = useSession();
  const { loading: teamLoading, team } = useTeam(isLoggedIn);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <h1>
            Bienvenue{" "}
            <span className="uppercase">{user?.username ?? "Dresseur"}</span>
          </h1>

          <p className="text-slate-600">
            Explore, combats, capture… et deviens une légende.
          </p>

          {loading && (
            <div className="mt-4 rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm">
              ⏳ Chargement de ta session...
            </div>
          )}

          {!loading && !isLoggedIn && (
            <div className="mt-4 rounded-xl border border-base-300 bg-base-200 px-4 py-4">
              <p className="text-sm text-slate-700">
                🎒 Prêt à commencer l'aventure ? Crée ton compte ou connecte-toi.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/inscription"
                  className="rounded-xl border bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950"
                >
                  Commencer l'aventure
                </Link>

                <Link
                  href="/connexion"
                  className="btn rounded-xl border px-4 py-2.5 text-sm font-semibold"
                >
                  Se connecter
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                  <div className="text-lg">🗺️</div>
                  <div className="mt-1 font-semibold">Explorer</div>
                  <div className="text-sm text-slate-600">
                    Découvre des zones et des rencontres.
                  </div>
                </div>

                <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                  <div className="text-lg">⚔️</div>
                  <div className="mt-1 font-semibold">Combattre</div>
                  <div className="text-sm text-slate-600">
                    Affronte des dresseurs et progresse.
                  </div>
                </div>

                <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                  <div className="text-lg">📘</div>
                  <div className="mt-1 font-semibold">Collectionner</div>
                  <div className="text-sm text-slate-600">
                    Complète ton Pokédex petit à petit.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && isLoggedIn && (
            <div className="mt-4 rounded-xl border border-base-300 bg-base-200 px-4 py-4">
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    👥 Ton équipe
                  </h2>
                  {teamLoading && (
                    <span className="text-xs text-slate-500">Chargement...</span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((slot) => {
                    const p = team[slot];

                    if (!p) {
                      return (
                        <div
                          key={slot}
                          className="rounded-xl border border-base-300 bg-base-200 p-4 text-center text-sm text-slate-600"
                        >
                          Slot vide
                        </div>
                      );
                    }

                    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`;

                    return (
                      <div
                        key={slot}
                        className="rounded-xl border border-base-300 bg-base-200 p-4 flex items-center gap-3"
                      >
                        <img
                          src={spriteUrl}
                          alt={`Pokemon ${p.pokemonId}`}
                          className="h-14 w-14"
                          loading="lazy"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            Pokémon #{p.pokemonId}
                          </div>
                          <div className="text-xs text-slate-600">
                            Dans l'équipe
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Astuce : l'équipe correspond à tes Pokémon équipé pour le
                  combat.
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/exploration"
                  className="rounded-xl border bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950"
                >
                  Continuer l'exploration
                </Link>

                <Link
                  href="/pokedex"
                  className="btn rounded-xl border px-4 py-2.5 text-sm font-semibold"
                >
                  Voir mon Pokédex
                </Link>

                <Link
                  href="/combat"
                  className="btn rounded-xl border px-4 py-2.5 text-sm font-semibold"
                >
                  Lancer un combat
                </Link>
              </div>

              <div className="mt-4 rounded-xl border border-base-300 bg-base-100 p-4">
                <div className="text-sm text-slate-600">Astuce du jour :</div>
                <div className="mt-1 text-sm text-slate-800">
                  💡 Pense à remplir ton Pokédex : certaines zones se débloquent
                  quand tu captures de nouveaux Pokémon.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PokeVenture — prototype de jeu
      </footer>
    </section>
  );
}
