# Kana Dojo — DESIGN.md

Identité visuelle enregistrée depuis le monde construit (vérité terrain, pas intention).

## Le monde : signalétique ferroviaire japonaise

Chaque syllabaire est une **ligne** (H = hiragana, K = katakana), chaque kana une
**station** (code façon Tokyo : `H-01` à `H-104`, `K-01` à `K-104`), chaque session
un **trajet**. Le SRS s'exprime dans le vocabulaire du réseau : une station ratée
est « en interruption » et le train y revient ; maîtrisée, elle est desservie.

Le monde refuse explicitement le défaut de catégorie (papier washi + serif +
sceau vermillon) et son opposé tout aussi cliché (Tokyo néon cyberpunk).

## Couleurs (stratégie « palette pleine », 4 rôles nommés)

| Rôle | Jour (oklch) | Nuit (oklch) | Usage exclusif |
|---|---|---|---|
| Fond | `0.972 0.003 115` blanc froid d'émail | `0.208 0.007 250` gris nuit | fond de page |
| Encre | `0.245 0.014 250` | `0.945 0.003 115` | texte principal |
| Ligne H | `0.47 0.085 152` vert uguisu | `0.7 0.09 152` | identité hiragana, CTA, focus, liens |
| Ligne K | `0.55 0.115 55` orange Chūō | `0.72 0.095 58` | identité katakana uniquement |
| Signal GO | `0.48 0.125 155` | `0.66 0.12 155` | feedback correct uniquement |
| Signal STOP | `0.5 0.19 27` | `0.65 0.17 27` | feedback erreur uniquement |
| Travaux | `0.58 0.125 75` ambre | `0.7 0.12 75` | état « familière » uniquement |

Règles : un accent principal (vert ligne H) verrouillé sur toute la page ;
l'orange n'apparaît que lié à la ligne K ; les signaux ne sont jamais décoratifs ;
pas de violet IA, pas de néon, jamais de `#000`/`#FFF` purs.

## Typographie

- **Zen Kaku Gothic New** (400/500/700/900) — kana, glyphe de ligne, 終着.
  La graisse 900 porte le caractère du panneau de quai.
- **Barlow** (400/500/600/700/800) — latin, chiffres, libellés. Grotesque de
  signalisation routière ; `font-variant-numeric: tabular-nums` partout où
  les données s'affichent.
- Hiérarchie par graisse et couleur, jamais par casse seule ; libellés de
  données en petites capitales espacées (langage natif des tableaux de départ).

## Formes

Un seul clavier : panneaux `rounded-xl` (12 px) avec bord 2 px et ombre douce
teintée, contrôles `rounded-lg` (8 px), pastilles de station = cercles parfaits.
Bande de ligne pleine en tête des panneaux (suspente de quai).

## Mouvement (pondération Jakub > Emil haute fréquence > Jhey délice)

| Interaction | Fréquence | Traitement |
|---|---|---|
| Réponse (raccourcis 1-4, clic) | très élevée | état instantané, transitions CSS 150 ms |
| Révélation du rōmaji | élevée | 220 ms, ease-out `[0.16, 1, 0.3, 1]` + blur |
| Question → question | élevée | entrée 220 ms / sortie 140 ms (asymétrique) |
| Erreur | élevée | micro-secousse x de 300 ms |
| Arrivée en terminus | rare | cascade de pastilles, spring `bounce: 0.12` |
| Chargement gare | rare | un seul moment orchestré + compteurs |

Propriétés GPU uniquement (transform, opacity, filter) ; `prefers-reduced-motion`
respecté partout (kill-switch CSS global + `useReducedMotion` par composant) ;
jamais d'animation déclenchée par clavier.

## Composants

`StationSign` (panneau de quai : bande ligne + code + glyphe + transcription
révélée) · `Roundel` (pastille 4 états : vide / incident / demi / pleine) ·
`RouteStrip` (afficheur embarqué de progression) · `MasteryStrip` (état réseau) ·
`Figure` (chiffre de tableau de départ, compteur en motion values) ·
`AppShell` (barre de guidage desktop, barre de quai mobile) · graphiques
dessinés en CSS depuis les données réelles.

## Accessibilité

Contrastes AA vérifiés jour/nuit ; focus visible 2 px vert ligne ; navigation
clavier complète (1-4, Entrée, Échap) ; `aria-live` sur le feedback ;
`aria-pressed` sur les sélecteurs ; cibles tactiles ≥ 44 px ; zéro débordement
horizontal jusqu'à 320 px.
