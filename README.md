# Kana Dojo 仮

**Apprenez les hiragana et les katakana avec la répétition espacée adaptative.**

Kana Dojo est une application web d'apprentissage des syllabaires japonais. Son principe :
les caractères que vous ratez reviennent **plus souvent**, ceux que vous réussissez
s'espacent de plus en plus — exactement comme le demandent les recherches sur la
mémoire (effet de répétition espacée et test actif).

## Fonctionnalités

### Entraînement adaptatif
- **Répétition espacée (SRS)** : chaque caractère possède une boîte de mémorisation
  (0 à 8). Une bonne réponse le fait monter, une erreur le renvoie en bas de la pile.
  Plus un caractère est fragile, plus il revient souvent.
- **Reprise en session** : un caractère raté **revient dans la même session** (après
  quelques questions) jusqu'à ce que vous le réussissiez.
- **Sélection pondérée** : le tirage des questions privilégie les caractères dus à
  révision, peu réussis, ou jamais vus.

### Modes de jeu
- **Syllabaires** : hiragana ひらがな, katakana カタカナ, ou les deux.
- **Groupes** : base (gojūon, 46), dakuten/handakuten (25), yōon (33).
- **Sens** : kana → rōmaji, rōmaji → kana, ou mixte.
- **Réponse** : choix multiples (raccourcis clavier 1-4) ou saisie clavier
  (variantes acceptées : *shi/si*, *chi/ti*, *fu/hu*…).

### Statistiques
- Précision globale, série de jours consécutifs, sessions, réponses du jour.
- **Graphe d'activité** des 14 derniers jours (tentatives / bonnes réponses).
- **Répartition de maîtrise** (nouveaux, en apprentissage, familier, maîtrisés).
- **Table détaillée par caractère** : précision, vues, boîte SRS, série, tri par
  faiblesse.
- **Tables de référence** hiragana/katakana avec code couleur de maîtrise.

### Détails soignés
- Identité visuelle **« signalétique ferroviaire japonaise »** : chaque syllabaire
  est une ligne (H / K), chaque kana une station, chaque session un trajet.
  Voir [DESIGN.md](./DESIGN.md).
- Typographie [Zen Kaku Gothic New](https://fonts.google.com/specimen/Zen+Kaku+Gothic+New)
  (kana) + [Barlow](https://fonts.google.com/specimen/Barlow) (latin, chiffres tabulaires),
  mode jour / nuit.
- Écran d'arrivée en terminus, codes de station façon Tokyo (H-01 à K-104).
- Entièrement **responsive** (mobile, tablette, desktop).
- Progression **sauvegardée localement** (localStorage) — aucune donnée envoyée
  sur un serveur, aucun compte requis.

## Stack technique

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- TypeScript strict
- [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion) (animations)
- [Phosphor Icons](https://phosphoricons.com) (icônes)
- Graphiques dessinés en CSS depuis les données

## Lancer en local

```bash
bun install        # ou npm install
bun run dev        # ou npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Déploiement

Le plus simple : [déployer sur Vercel](https://vercel.com/new) en important ce dépôt.

```bash
npm i -g vercel
vercel deploy --prod
```

## Licence

MIT — voir [LICENSE](LICENSE).
