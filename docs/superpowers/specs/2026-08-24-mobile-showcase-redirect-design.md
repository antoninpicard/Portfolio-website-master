# Mobile : redirection vers My Showcase (site inner)

## Contexte

Le master (`antoninpicard.com`) est un portfolio 3D basé sur Three.js : une scène 3D avec un ordinateur virtuel dont l'écran affiche, via une iframe, le site "inner" (`antoninpicard-inner.vercel.app`), un bureau façon Windows 95.

Ce moteur 3D (chargement des textures, modèles, sons, contrôles caméra) n'a pas de sens sur téléphone : trop lourd, pas ergonomique au toucher. Le site inner ouvre déjà automatiquement l'application "My Showcase" (le CV/portfolio interactif : Home, About, Experience, Projects, Contact) au chargement, via `Desktop.tsx`.

## Objectif

Sur mobile, le master ne doit **jamais démarrer le moteur Three.js**. À la place, il affiche directement une iframe plein écran vers le site inner, qui ouvrira de lui-même "My Showcase".

Aucune modification n'est faite dans le projet `inner`. Le chrome OS du site inner (bureau, icônes, barre des tâches, fenêtre avec barre de titre) reste visible tel quel autour de My Showcase — c'est accepté comme faisant partie de l'identité visuelle du portfolio.

## Détection mobile

Un appareil est considéré "mobile" si les deux conditions sont vraies :
- `window.matchMedia('(pointer: coarse)').matches` (pointeur tactile grossier, typique d'un doigt plutôt qu'une souris)
- `window.innerWidth <= 768` (seuil ajustable si besoin plus tard)

Cette détection est évaluée **une seule fois**, au chargement de la page. Elle ne se réévalue pas au resize ou au changement d'orientation — un simple refresh de page suffit pour changer de mode si besoin. Ce choix évite d'avoir à détruire/recréer proprement le moteur Three.js à la volée (`Application` a une méthode `destroy()`, mais l'utiliser pour un hot-switch ajouterait une complexité non justifiée par le besoin réel).

Une fenêtre desktop redimensionnée en largeur reste en mode desktop (pas de pointeur tactile), donc pas de faux positif pour les devs qui réduisent leur fenêtre de navigateur.

## Architecture

### Point de branchement — `src/script.ts`

Avant l'instanciation de `Application` (qui démarre tout le pipeline Three.js : `Sizes`, `Camera`, `Renderer`, `Resources`, `World`, `UI`), on teste l'appareil :

```ts
import './style.css';

import Application from './Application/Application';
import { isMobileDevice } from './Application/Utils/isMobileDevice';
import { renderMobileShowcase } from './Application/Mobile/MobileShowcase';

if (isMobileDevice()) {
    renderMobileShowcase();
} else {
    const app: Application = new Application();
}
```

Sur mobile, `Application` n'est jamais instanciée : aucun chargement d'asset 3D (textures, modèles, sons), aucun canvas WebGL, aucun contrôle caméra.

### `src/Application/Utils/isMobileDevice.ts` (nouveau)

Exporte une fonction `isMobileDevice(): boolean` qui applique la règle de détection décrite ci-dessus.

### `src/Application/Utils/innerSiteUrl.ts` (nouveau)

Centralise la résolution de l'URL du site inner, actuellement dupliquée en dur dans `MonitorScreen.ts` :
- Prod : `https://antoninpicard-inner.vercel.app/`
- Si le paramètre de requête `?dev` est présent sur la page master : `http://localhost:3000/`

Exporte une fonction `getInnerSiteUrl(): string`.

`MonitorScreen.ts` est refactorisé pour utiliser cette fonction au lieu de sa logique dupliquée, afin que `MobileShowcase.ts` et `MonitorScreen.ts` restent cohérents sans dupliquer cette règle à deux endroits.

### `src/Application/Mobile/MobileShowcase.ts` (nouveau)

Exporte une fonction `renderMobileShowcase(): void` qui :
1. Crée un élément `<iframe>` dont le `src` vaut `getInnerSiteUrl()`.
2. Applique les styles nécessaires pour un plein écran : `position: fixed; inset: 0; width: 100%; height: 100dvh; border: 0;`.
3. Ajoute l'iframe au `<body>`.

Contrairement à l'iframe du `MonitorScreen.ts` (mode desktop), celle-ci n'a **pas** de logique de bubbling `postMessage`/souris — cette logique existe uniquement pour que les mouvements de souris dans l'iframe affectent la caméra 3D, ce qui n'a pas de sens ici puisqu'il n'y a pas de scène 3D.

Les éléments existants du DOM (`#webgl`, `#ui`, `#css`, `#overlay`, `#ui-interactive` dans `index.html`) restent inutilisés et vides sur mobile, puisque rien ne les peuple en l'absence d'`Application`.

## Flux résultant

- **Desktop / pointeur souris** : comportement inchangé, scène 3D complète avec l'ordinateur virtuel et son écran-iframe.
- **Mobile / pointeur tactile, écran ≤ 768px** : chargement quasi instantané (pas d'assets 3D), iframe plein écran vers le site inner, qui ouvre automatiquement "My Showcase" avec le bureau Windows 95 autour.

## Hors périmètre

- Aucune modification du projet `inner`.
- Pas de masquage du chrome OS (bureau, barre des tâches, barre de titre de fenêtre) autour de My Showcase.
- Pas de bascule dynamique au resize/rotation après le chargement initial.
- Pas de nouveau test automatisé (projet sans suite de tests existante pour ce genre de logique de bootstrap) — validation manuelle en redimensionnant/en émulant un appareil tactile dans les devtools.

## Validation manuelle prévue

1. `npm run dev` sur le master.
2. Devtools en mode réel appareil mobile (ex. émulation iPhone) : vérifier qu'aucune requête réseau vers les assets 3D (textures/modèles/sons) n'est déclenchée, et que l'iframe plein écran affiche le bureau inner avec My Showcase déjà ouvert.
3. Revenir en mode desktop (pointeur souris, grande largeur) : vérifier que la scène 3D se charge normalement, sans régression.
4. Avec `?dev` dans l'URL du master en mode mobile émulé : vérifier que l'iframe pointe vers `localhost:3000` (nécessite le serveur de dev inner lancé en parallèle).
