# Real App Animation Changes

This documents the changes made to the real app only, so the same behavior can be ported elsewhere. Ignore `demo.js` for this guide.

## Files Changed

- `app.js`
- `styles.css`

## Behavior Added

- Bracket lines animate in stages by round.
- Winner flags reveal during each round's line animation instead of all appearing immediately.
- Dashed guide lines remain visible underneath animated completed paths.
- Placeholder node circles remain visible until winner flags fade in.
- The final center can show the real champion's flag once live data contains a finished `FINAL` match.
- The World Cup trophy SVG overlays the champion flag.
- Confetti runs when the champion center reveals.

## App Timing Constants

Add these near the existing geometry constants in `app.js`:

```js
let champion = null;

const innerFlagRadius = 12 * 1.6;
const branchDrawMs = 200;
const flagRevealFraction = .25;
const stagePauseMs = 0;
const stageIntervalMs = branchDrawMs + stagePauseMs;

const branchDelay = round => round * stageIntervalMs;
const flagDelay = round => branchDelay(round) + branchDrawMs * flagRevealFraction;
const championDelay = () => branchDelay(4) + branchDrawMs;
```

Current timing:

- Round of 32 lines start at `0ms`
- Round of 32 flags reveal at `50ms`
- Round of 16 lines start at `200ms`
- Round of 16 flags reveal at `250ms`
- Quarter-final lines start at `400ms`
- Quarter-final flags reveal at `450ms`
- Semi-final lines start at `600ms`
- Semi-final flags reveal at `650ms`
- Final center paths start at `800ms`
- Champion center reveal starts at `1000ms`

## Branch Rendering

In `branches()`, add a helper for consistent branch markup:

```js
const branchPath = (cls, d, delay) =>
  `<path class="branch ${cls}"${delay == null ? "" : ` style="--branch-delay:${delay}ms"`} d="${d}"/>`;
```

For completed paths, render two paths:

1. A dashed guide path underneath.
2. The animated solid path above it.

For round 0 branches:

```js
const d = `M${source[0]} ${source[1]} L${stem[0]} ${stem[1]} L${target[0]} ${target[1]}`;
if (state(g)==="complete") out += branchPath("pending branch-guide",d);
out += branchPath(state(g)==="complete"?"advanced":"pending",d,branchDelay(g.r));
```

For later-round branches:

```js
const d = `M${source[0]} ${source[1]} L${stem[0]} ${stem[1]} L${target[0]} ${target[1]}`;
if (done) out += branchPath("pending branch-guide",d);
out += branchPath(done?"advanced":"pending",d,branchDelay(g.r));
```

For semi-final-to-center paths:

```js
const finalClass = g.w ? "advanced final-branch" : "pending";
const d = `M${source[0]} ${source[1]} L${stem[0]} ${stem[1]} L500 500`;
if (g.w) out += branchPath("pending branch-guide",d);
out += branchPath(finalClass,d,g.w ? branchDelay(4) : null);
```

## Match Node Rendering

Winner flags use the same larger live-app styling:

```js
const winnerFlag = g.w
  ? flagSVG(g.w,x,y,innerFlagRadius,`winner-${g.id}`,"winner-flag")
  : "";
```

Always render a node circle under the flag. If the match has a winner, the circle uses `pending staged-placeholder`:

```js
const nodeCore =
  `<circle class="node-core ${g.w ? "pending staged-placeholder" : st}" cx="${x}" cy="${y}" r="${g.r===0?4.4:5}"/>`;
```

Set the flag delay on the match group:

```js
return `<g class="match-group" data-id="${g.id}" tabindex="0" role="button"
  aria-label="${roundTitle[g.r]}: ${teams[0]?team[teams[0]][0]:"to be decided"} versus ${teams[1]?team[teams[1]][0]:"to be decided"}"
  style="--flag-delay:${flagDelay(g.r)}ms;animation-delay:${i*20}ms">
  ${st==="live" ? `<circle class="live-halo" cx="${x}" cy="${y}" r="5"/>` : ""}
  ${nodeCore}${winnerFlag}
  <circle class="match-target" cx="${x}" cy="${y}" r="21"/>
  ${score?`<text class="score ${st}" x="${tx}" y="${ty+3}">${score}</text>`:""}
  ${g.pen?`<text class="pen-note" x="${tx}" y="${ty+11}">P ${g.pen[0]}–${g.pen[1]}</text>`:""}
</g>`;
```

## Champion Center

Replace the old neutral `trophy()` implementation with a champion-aware version:

```js
function trophy() {
  return `<g class="trophy" aria-label="World Cup trophy" style="--champion-delay:${championDelay()}ms">
    ${championCenter()}
    <image class="trophy-icon ${champion ? "champion-trophy" : ""}" href="assets/world-cup-trophy.svg" x="470" y="452" width="60" height="75" preserveAspectRatio="xMidYMid meet"/>
    ${confetti()}
    <text class="final-label ${champion ? "champion-label" : ""}" x="500" y="570">${champion ? `CHAMPION · ${champion}` : "THE FINAL · 19 JUL"}</text>
  </g>`;
}
```

Add `championCenter()`:

```js
function championCenter() {
  if (!champion) return `<circle class="center-ring" cx="500" cy="500" r="58"/>`;

  return `<g class="champion-center" aria-label="${team[champion][0]} won the World Cup">
    <defs><clipPath id="champion-clip"><circle cx="500" cy="500" r="58"/></clipPath></defs>
    <g clip-path="url(#champion-clip)">
      <svg class="champion-flag-fill" x="438" y="438" width="124" height="124" viewBox="0 0 40 40" preserveAspectRatio="xMidYMid slice">
        ${crestArt(champion)}
      </svg>
    </g>
    <circle class="center-ring champion-ring" cx="500" cy="500" r="58"/>
  </g>`;
}
```

## Confetti

Add `confetti()`:

```js
function confetti() {
  if (!champion) return "";
  const count = 2008;
  const colors = ["#cf4939","#f1c83c","#1768ad","#18814d","#292a28","#78b5df"];
  return `<g class="confetti" aria-hidden="true">${Array.from({length:count},(_,i) => {
    const angle = (i / count) * Math.PI * 2;
    const distance = 64 + (i % 6) * 15;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance - 18 - (i % 4) * 8;
    const color = colors[i % colors.length];
    const delay = championDelay() + (i % 7) * 26;
    const rotate = 180 + (i % 5) * 92;
    const width = i % 3 === 0 ? 4 : 6;
    const height = i % 2 === 0 ? 10 : 7;
    return `<rect class="confetti-piece" x="${100 - width/2}" y="${100 - height/2}" width="${width}" height="${height}" rx="1" fill="${color}" style="--tx:${x}px;--ty:${y}px;--rot:${rotate}deg;animation-delay:${delay}ms"/>`;
  }).join("")}</g>`;
}
```

Note: `count` is currently `2008` in the app. Lower it if the target app needs a lighter DOM load.

## Real Data Champion Hook

Add this helper near the API bracket-building code:

```js
function finalChampion(matches) {
  const final = matches.find(match => match.stage === "FINAL");
  if (!final || final.status !== "FINISHED") return null;
  return apiGame(final,4,0).w;
}
```

In `loadFootballData()`, set `champion` before rendering:

```js
const payload = await response.json();
champion = finalChampion(payload.matches || []);
games = buildApiBracket(payload.matches || []);
renderBracket();
```

In the error path, reset it:

```js
champion = null;
```

## CSS Changes

Update branch animation to use a CSS variable delay:

```css
.branch {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.65;
  vector-effect: non-scaling-stroke;
  stroke-linecap: square;
  stroke-linejoin: miter;
  stroke-dasharray: 900;
  stroke-dashoffset: 900;
  animation: draw 1.2s cubic-bezier(.4,0,.2,1) var(--branch-delay, 0ms) forwards;
}
```

Add winner flag reveal:

```css
.winner-flag {
  opacity: 0;
  animation: revealFlag .24s ease-out var(--flag-delay, 0ms) forwards;
}

@keyframes revealFlag {
  to { opacity: 1; }
}
```

Add final/champion/confetti styles:

```css
.final-branch { stroke-width: 2.8; }

.champion-center,
.champion-trophy,
.champion-label {
  opacity: 0;
  animation: championReveal .28s ease-out var(--champion-delay, 1.96s) forwards;
}

.champion-ring {
  fill: none;
  stroke-width: 2;
}

.champion-trophy {
  filter: drop-shadow(0 0 1px rgba(241,237,227,.9)) drop-shadow(0 1px 2px rgba(241,237,227,.7));
}

.champion-label {
  font-size: 8px;
}

.confetti { pointer-events: none; }

.confetti-piece {
  opacity: 0;
  transform-origin: 500px 500px;
  transform-box: view-box;
  animation: confettiBurst 1.15s cubic-bezier(.16,.72,.22,1) forwards;
}

@keyframes championReveal {
  to { opacity: 1; }
}

@keyframes confettiBurst {
  0% { opacity: 0; transform: translate(0,0) scale(.35) rotate(0); }
  12% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--tx),var(--ty)) scale(1) rotate(var(--rot)); }
}
```

Update reduced-motion support so delayed hidden elements do not stay hidden:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-delay: 0ms !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

## Porting Checklist

- Add `champion` state.
- Add staged animation constants.
- Add `branchDelay`, `flagDelay`, and `championDelay`.
- Update branch rendering to emit dashed guide paths plus animated advanced paths.
- Update match node rendering to keep placeholder circles under winner flags.
- Add `.winner-flag` delay to match-group style.
- Replace `trophy()` with champion-aware rendering.
- Add `championCenter()` and `confetti()`.
- Add `finalChampion()` and set `champion` from real `FINAL` match data.
- Add the CSS animation blocks above.
- Confirm live app still renders neutral center when no final champion exists.
- Confirm live app reveals champion center only when final match data is finished.
