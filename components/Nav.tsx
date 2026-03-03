"use client";

import { useSession } from "@/hook/useSession";
import { logoutAction } from "@/app/actions/auth";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Nav() {
  const { loading, isLoggedIn, user, refresh } = useSession();
  const username = user?.username ?? "";

  const pathname = usePathname() ?? "/";
  const isOnLogin = pathname === "/connexion";
  const isOnRegister = pathname === "/inscription";

  async function onLogoutClick() {
    try {
      await logoutAction();
      await refresh();
      window.location.href = "/";
    } catch {
      console.log("Deconnexion impossible");
    }
  }

  return (
    <nav className="navbar bg-base-100 shadow-sm px-20">
      <div className="navbar-start">
        {isLoggedIn && (
          <div className="dropdown">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost lg:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={-1}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <Link href="/">Accueil</Link>
              </li>
              <li>
                <Link href="/pokedex">Pokédex</Link>
              </li>
              <li>
                <Link href="/combat">Combat</Link>
              </li>
              <li>
                <Link href="/inventaire">Inventaire</Link>
              </li>
              <li>
                <Link href="/metiers">Métiers</Link>
              </li>
            </ul>
          </div>
        )}
        <Link
          className="text-xl hover:text-black text-black mx-2"
          href="/"
        >
          PokeVenture
        </Link>
      </div>
      {isLoggedIn && (
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href="/">Accueil</Link>
            </li>
            <li>
              <Link href="/pokedex">Pokédex</Link>
            </li>
            <li>
              <Link href="/combat">Combat</Link>
            </li>
            <li>
              <Link href="/inventaire">Inventaire</Link>
            </li>
            <li>
              <Link href="/metiers">Métiers</Link>
            </li>
          </ul>
        </div>
      )}
      <div className="navbar-end">
        <div className="flex justify-center gap-3">
          {(isOnLogin || !isLoggedIn) && (
            <Link
              className="btn rounded-xl border px-4 py-2.5 text-sm font-semibold"
              href="/connexion"
            >
              Connexion
            </Link>
          )}
          {(isOnRegister || !isLoggedIn) && (
            <Link
              className="rounded-xl border bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950"
              href="/inscription"
            >
              Inscription
            </Link>
          )}
        </div>
        {isLoggedIn && (
          <>
            <span className="text-sm font-semibold text-slate-700 px-4.5">
              Hello, {username}
            </span>
            <button
              className="rounded-xl border bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 sm:hidden"
              onClick={onLogoutClick}
            >
              <i className="fa-solid fa-right-from-bracket" />
            </button>
            <button
              className="rounded-xl border bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 hidden sm:inline-flex"
              onClick={onLogoutClick}
            >
              Se déconnecter
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
