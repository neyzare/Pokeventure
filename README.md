# PokeVenture

Petit prototype de jeu (exploration / combats / pokédex) en React + Telefunc + Prisma + PostgreSQL.

---

## Prérequis

- Node.js (version récente recommandée)
- npm
- PostgreSQL (en local ou via un service type Supabase/Neon/etc.)

---

## Installation

### 1) Cloner le projet

```bash
git clone https://github.com/pablitoodt/pokeVenture.git
cd pokeVenture
```

### 2) Installer les dépendances

```bash
npm install
```

---

## Base de données (PostgreSQL)

### 3) Créer la base

Crée une base PostgreSQL (exemple en local) :

```bash
createdb pokeventure
```

---

## Variables d’environnement (.env)

### 4) Créer le fichier .env

À la racine du projet, crée un fichier .env :

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
NODE_ENV="development"
```

---

## Prisma

### 5) Générer Prisma Client

```bash
npx prisma generate
```

### 6) Appliquer / récupérer le schéma de DB

Crée les tables depuis schema.prisma :

```bash
npx prisma migrate dev --name init
```

---

## Lancer le projet

### 7) Démarrer en dev

```bash
npm run dev
```

Ensuite ouvre l’URL affichée dans le terminal (souvent http://localhost:3000).
# Pokeventure
