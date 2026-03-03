"use client";

import { useEffect, useState, Suspense } from "react";
import {
  profileAction,
  registerAction,
  usernameExistsAction,
} from "@/app/actions/auth";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

type Starter = "arcko" | "poussifeu" | "gobou";

const STARTERS: { id: Starter; label: string; emoji: string }[] = [
  { id: "arcko", label: "Arcko", emoji: "🌿" },
  { id: "poussifeu", label: "Poussifeu", emoji: "🔥" },
  { id: "gobou", label: "Gobou", emoji: "💧" },
];

function InscriptionContent() {
  const [phase, setPhase] = useState<"signup" | "profile">("signup");
  const [profileStep, setProfileStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    trainerName: "",
    pokemon: null as Starter | null,
  });

  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const inputBase =
    "mt-1 w-full rounded-xl border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2";

  useEffect(() => {
    const phaseParam = searchParams.get("phase");
    if (phaseParam === "profile") {
      setPhase("profile");
    }
  }, [searchParams]);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const result = await registerAction({
        email: form.email,
        password: form.password,
      });

      if (result && result.success === true) {
        setSuccess("Inscription réussie !");
        setTimeout(() => {
          setPhase("profile");
          setSuccess(null);
        }, 1000);
      } else if (result && result.success === false) {
        setError(result.error || "Erreur inconnue");
      } else {
        setError("Format de réponse inattendu");
      }
    } catch (err) {
      console.error("❌ Error caught:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  async function checkUsernameExists(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const result = await usernameExistsAction(form.trainerName.trim());

      if (result.success === true) {
        setSuccess("Nom de dresseur validé !");
        setTimeout(() => {
          nextProfile();
          setSuccess(null);
        }, 1000);
      } else if (result.success === false) {
        setError(result.error || "Erreur inconnue");
      } else {
        setError("Format de réponse inattendu");
      }
    } catch (err) {
      console.error("❌ Error caught:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  async function onProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const result = await profileAction({
        trainerName: form.trainerName,
        starter: form.pokemon!,
      });

      if (result.success === true) {
        setSuccess("Profil complété avec succès !");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else if (result && result.success === false) {
        setError(result.error || "Erreur inconnue");
      } else {
        setError("Format de réponse inattendu");
      }
    } catch (err) {
      console.error("❌ Error caught:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  const nextProfile = () => {
    setProfileStep((s) => (s === 1 ? 2 : 2));
  };

  const previousProfile = () => {
    setProfileStep((s) => (s === 2 ? 1 : 1));
  };

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">
                  {phase === "signup" ? "Inscription" : "Complète ton profil"}
                </h1>

                {phase === "profile" && (
                  <span className="text-xs font-medium text-slate-500">
                    Étape {profileStep}/2
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-600">
                {phase === "signup"
                  ? "Crée ton compte pour commencer l'aventure."
                  : "Finalise ton profil pour démarrer le jeu."}
              </p>

              {phase === "profile" && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  💰 Tu commenceras le jeu avec{" "}
                  <span className="font-semibold">3000 Pokédollars</span>.
                </div>
              )}
            </div>

            {phase === "signup" && (
              <form className="space-y-4" onSubmit={onSignupSubmit}>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="ton@email.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={`${inputBase}`}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className={`${inputBase}`}
                  />
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    ❌ {error}
                  </div>
                )}

                {success && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    ✅ {success}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl border bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 disabled:opacity-50"
                >
                  S&apos;inscrire
                </button>

                <div className="flex items-center justify-center text-sm">
                  <a
                    className="text-slate-600 hover:text-slate-900"
                    href="/connexion"
                  >
                    Déjà un compte ? Connecte-toi ici.
                  </a>
                </div>
              </form>
            )}

            {phase === "profile" && (
              <form className="space-y-4" onSubmit={onProfileSubmit}>
                {profileStep === 1 && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Nom du dresseur
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Sacha"
                        value={form.trainerName}
                        onChange={(e) =>
                          update("trainerName", e.target.value)
                        }
                        className={`${inputBase}`}
                      />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      🎒 Ton aventure commence maintenant,{" "}
                      <span className="font-semibold">
                        {form.trainerName || "________"}
                      </span>{" "}
                      !
                    </div>
                  </>
                )}

                {profileStep === 2 && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Choisis ton Pokémon de départ
                      </p>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {STARTERS.map((s) => {
                          const selected = form.pokemon === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => update("pokemon", s.id)}
                              className={[
                                "rounded-xl border px-4 py-3 text-left transition",
                                selected
                                  ? "border-slate-900 ring-2 ring-slate-300 bg-slate-50"
                                  : "border-slate-200 hover:border-slate-300",
                              ].join(" ")}
                            >
                              <div className="text-lg">{s.emoji}</div>
                              <div className="mt-1 font-semibold text-slate-900">
                                {s.label}
                              </div>
                              <div className="text-xs text-slate-600">
                                Starter {s.label}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      ✅ Récap :{" "}
                      <span className="font-semibold">
                        {form.trainerName || "Nom"}
                      </span>{" "}
                      • Starter{" "}
                      <span className="font-semibold">
                        {form.pokemon
                          ? STARTERS.find((s) => s.id === form.pokemon)?.label
                          : "_____"}
                      </span>
                    </div>
                  </>
                )}

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    ❌ {error}
                  </div>
                )}

                {success && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    ✅ {success}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  {profileStep === 2 && (
                    <button
                      type="button"
                      onClick={previousProfile}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Précédent
                    </button>
                  )}

                  {profileStep === 1 && (
                    <button
                      type="button"
                      onClick={checkUsernameExists}
                      className="w-full rounded-xl border bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  )}

                  {profileStep === 2 && (
                    <button
                      type="submit"
                      className="w-full rounded-xl border bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 disabled:opacity-50"
                    >
                      {loading ? "Inscription en cours..." : "Confirmer mon profil"}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="relative bg-slate-100">
            <Image
              src="/pokemons.png"
              alt="Illustration du jeu"
              width={800}
              height={600}
              className="h-64 w-full object-cover md:h-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Inscription() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Chargement...</div>}>
      <InscriptionContent />
    </Suspense>
  );
}
