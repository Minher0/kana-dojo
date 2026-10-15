<p align="center">
  <img src="public/logo.png" width="120" alt="Logo Kana Dojo" />
</p>

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
- **Réponse** : choix multiples (raccourcis clavier 1-4), saisie clavier
  (variantes acceptées : *shi/si*, *chi/ti*, *fu/hu*…), ou **mix** —
  la moitié des questions en QCM, l'autre moitié en saisie (répartition
  tirée au départ, l'ordre est battu).
- **Stations** : sélection fine kana par kana via la **feuille de service**
  (208 stations, tout est coché par défaut — décochez ce que vous ne voulez
  pas étudier). Basculées par ligne, par section ou à l'unité ; les stations
  hors service apparaissent éteintes sur le plan du réseau.
- **Démarrage** : au lancement, une « mise en service » animée (logo,
  enseigne, LED, portes de quai qui s'ouvrent sur la gare) — non bloquante.

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

### La gare est vivante (sons & animations)
- **Effets sonores 100 % synthétisés** (Web Audio API, aucun fichier audio) :
  carillon de quai pour une bonne réponse, avertisseur doux pour une erreur,
  avertisseur de portes au départ, mélodie de départ (発車メロディー) au nouveau
  départ, tannoy + fanfare à l'arrivée en terminus. Bascule persistée dans
  l'en-tête.
- **Animations de voyage** : bandeau LED 次は (prochaine station), traînées de
  vitesse entre les questions, tampon officiel 正 sur les bonnes réponses,
  tampon doré 合格 / 満点 et pluie de pastilles au terminus, afficheur à palettes
  (split-flap) sur le tableau de service, rame qui avance sur le bandeau de
  progression, rails qui défilent en session, portes de quai entre les vues.
- **Mouvement réduit respecté** partout (`prefers-reduced-motion`).

## Installer sur téléphone (PWA)

Kana Dojo est une **application web installable** (PWA) :

- **Android / Chrome, Edge** : le bouton **« Installer »** apparaît dans l'en-tête
  et sur la page d'accueil tant que l'application n'est pas installée. Un appui,
  et l'icône rejoint votre écran d'accueil.
- **iPhone / Safari** : le bouton **« Comment installer »** ouvre une feuille
  d'instructions (Partager → « Sur l'écran d'accueil » → Ajouter).
- Une fois installée, l'application fonctionne **hors connexion** (service worker
  + cache) et démarre en plein écran. Le bouton disparaît une fois l'app installée.

## Stack technique

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- TypeScript strict
- [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion) (animations)
- [Phosphor Icons](https://phosphoricons.com) (icônes)
- Web Audio API (sons synthétisés) + PWA native (manifest, service worker)
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
