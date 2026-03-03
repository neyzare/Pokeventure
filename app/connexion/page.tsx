"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { useSession } from "@/hook/useSession";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoggedIn, user } = useSession();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginAction({ email, password });

      if (result.success) {
        if (!result.username) router.push("/inscription?phase=profile");
        else router.push("/");
        return;
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="w-full flex items-center justify-center p-4">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2">
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

            <div className="p-6 md:p-10 flex flex-col justify-center">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">
                  Connexion
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Accède à ton compte pour commencer l&apos;aventure.
                </p>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    ❌ {error}
                  </div>
                )}
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="ton@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl border bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Connexion en cours..." : "Se connecter"}
                </button>

                <div className="flex items-center justify-center text-sm">
                  <a
                    type="button"
                    className="text-slate-600 hover:text-slate-900"
                    href="/inscription"
                  >
                    Créer un compte
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
