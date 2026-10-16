# gh-depend-alerts

Petit tableau de bord pour avoir une vue d'ensemble des alertes de sécurité **Dependabot** sur l'ensemble de ses repositories GitHub.

GitHub n'offre pas de vue globale pour un compte personnel (la _Security overview_ n'existe que pour les organisations). Ce projet comble ce manque : un script récupère les alertes de tous les repos via la CLI `gh`, puis une application Vue les affiche triées par gravité.

## Fonctionnement

1. `npm run alerts` interroge l'API GitHub (via `gh`) et écrit le résultat dans `public/alerts.json`, avec la date de récupération.
2. L'application Vue lit ce fichier statique et l'affiche : totaux par sévérité, tableau par repository, détail des alertes au clic.

L'API n'est donc sollicitée qu'à la demande, et aucun token n'est exposé dans le navigateur.

## Prérequis

- [Node.js](https://nodejs.org) 18 ou plus
- [GitHub CLI](https://cli.github.com) 2.48 ou plus (option `--slurp`), authentifiée :

```bash
gh auth login
gh auth refresh -s security_events
```

## Installation

```bash
npm install
```

## Utilisation

```bash
# Récupérer les alertes (tous les repos du compte connecté)
npm run alerts

# ... ou ceux d'un compte / d'une organisation précise
npm run alerts -- nom-du-compte

# Lancer l'application
npm run dev
```

Relancer `npm run alerts` à chaque fois que l'on veut actualiser les données. La date de dernière récupération est affichée en haut de la page.

> `public/alerts.json` contient des informations sur des repos potentiellement privés : il est ignoré par Git (voir `.gitignore`) et ne doit pas être publié.

## Stack

- [Vue 3](https://vuejs.org) (Composition API) + TypeScript
- [Vite](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com) + [daisyUI](https://daisyui.com)
- [GitHub CLI](https://cli.github.com) pour la collecte des données

## Structure

```
scripts/fetch-alerts.mjs   Collecte des alertes via gh → public/alerts.json
src/App.vue                Interface (tableau, totaux, détail)
public/alerts.json         Données générées (non versionnées)
```

## À propos du code

Le code initial (script de collecte et composant `App.vue`) a été généré avec l'assistant IA [Claude](https://claude.ai) d'Anthropic, puis relu, adapté et personnalisé par l'auteur (passage à TypeScript, intégration de Tailwind et daisyUI, ajustements de l'interface).
