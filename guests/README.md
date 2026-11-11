# The Merge guests: how a guest pet is made

Each guest who walks into Henni's studio is one file here, `<slug>.js`, built into `pet-guests.js` by `tools/build-guests.mjs`. The slugs, names, episodes and "live" flags are in `guests/merge-guests.json`. `jesse-vincent.js` is the worked example: read it first.

```js
ktGuest('slug', function (K) {        // K = { HH, STRANDS, swap(rows, i, row), FACE }
  var HH = K.HH;                       // head height (12.92): the face spans y 0..HH
  return {
    ramps: { ghair: [...], gskin: [...], gtop: [...], gpant: [...], gbrd: [...], gxa: [...] },  // 5 hex each, darkest first
    def: { t: 'gbrd', b: 'ghair' },    // optional key overrides: 'ramp', 'ramp-1', 'ramp+1', 'ramp=0', or '#hex'
    faces: { smile: [12 rows], blink: [...], talk: [...] },
    head: { r: [12 rows of 10], b: [12 rows of 12], t: 'H' },  // side and back of the head (l = mirrored r)
    hair: [[x0, y0, z0, x1, y1, z1, tex, group], ...],         // head space
    glasses: [[...], ...],                                        // head space
    phonesY: HH + 2.6,                 // where the headphone band sits: just above their hair or cap
    torsoW: 6, torso: tex, hem: 'o', arm: tex,                  // upper body
    body: [[...], ...],                // upper-body space: collars, lapels, lanyards, jewellery
    gesture: function (p, tp) { p.aA = [...]; p.aB = [...]; }   // how they move their arms while talking
  };
});
```

## Space

- **Head space:** x −6..6 (−x is their right, +x their left), y 0..HH bottom to top, z −4.5..6 with the face at z = 6. Ears: x ±6..±7, y 4.4..7.6, z −1..1. Face row r covers y from HH·(11−r)/12 to HH·(12−r)/12: brows are row 3, eyes rows 5–6 (columns 3–4 and 7–8), nose rows 7–8, mouth rows 8–10.
- **Upper-body space:** torso x ±torsoW, y 11.2..21.5, z ±3 (front at z = 3). Neck y 20.5..22.2. The head sits on top at y 21.6. Arms hang from (±7.7, 21): box x −2..2, y −11..0, with the hands as the last two rows.
- **Arm angles** `[rx, ry, rz]` are radians. Negative rx swings the arm forward and up. `aB` is the arm on +x; positive rz lifts it outward. `aA` is the mirror (negative rz lifts it). Seated hands rest at about `[-0.85, 0, ±0.12]`.

## Textures

- **The texture object** is `{ all, f, b, l, r, t, d }`: front, back, left, right, top and bottom faces.
  - Each face is a letter (the whole face) or rows of letters, top to bottom.
  - Side faces read front to back.
  - `.` is see-through.
- **Guest letters** are re-coloured to the guest's ramps:
  - hair: `H` (base), `h` (step darker), `G` (step lighter), `F` (step darker)
  - skin: `S` and `s` (step darker)
  - stubble: `t` (skin unless `def` says otherwise)
  - top: `O` (base), `o` and `k` (step darker), `n` (step lighter), `q` (darkest)
  - trousers: `P` and `Q`
  - brows: `b` (brown unless `def` says otherwise)
  - extra ramps: digits `1`–`9` = `gxa`, `gxa-1`, `gxb`, `gxb-1`, `gxc`, `gxc-1`, `gxd`, `gxd-1`, `gxe`
- **Fixed colours:** `E` eyes, `x` eye glint, `w` white (teeth and white details), `m` mouth, `X` near-black, `K`/`Z` steel, `M` grey.
  - Don't use `D`: the Ink colourway turns it dark.
  - Don't use `L`: the orange is Henni's one accent.
- **Faces** keep Henni's eye layout: row 5 is `SSSxESSxESSS`, and the glint flips automatically when they look the other way. `PRI` keeps eyes, mouth, teeth and brows when a face turns.

## Art rules

- **Recognisable from their real signature details, never a caricature.** Don't exaggerate anyone's face or body.
- **Look at their reference frames:**
  - `research/sheets/<slug>.png`
  - `research/frames/<videoId>/`
  - `research/guests.json`, for sampled colours and notes
- **Take skin from the sampled colour,** lifted slightly toward Henni's brightness. Don't pick it by eye.
- **Light comes from the top-left.** A 5-step ramp maps shadow, front, lit side and top to steps 1–4, and the face always uses step 2.
- **Dark hair and clothes are lifted like Henni's black-hoodie colourway** (`bh-midnight`): step 1 at least 1.8:1 and step 2 at least 2.4:1 on `#131118`. The review tool checks this. Dark clothes filmed under orange set light sample as brown; draw them as a lifted near-black.
- **No outlines.** Separate parts with different `group` names when you want a crease line between them (clumps of hair, a lapel).
- **The headphones go on top of their hair or cap.** Set `phonesY` so the band doesn't cut through it.
- **Lessons from the first 16 guests:**
  - The chin hides the torso texture's top row (y above about 20.4). Necklines, chokers and logos start at row 1 or 2, or go in a `body` box around y 19.3–20.4.
  - Near-black accessories, like black glasses, use a flat colour in `def` (`'#hex'`) rather than a ramp.
  - Sleek hair keeps every lock in one group (no creases). Curls use a group per clump.
  - Every head needs a back panel of hair in the main group. Otherwise a crease across the back reads as a mouth.
  - Dark ramps: keep steps 3 and 4 close to step 2, or top faces turn light brown or grey.
  - Both arms share one texture, so a detail on one wrist can only go on one arm face (`l` or `r`).
  - Guests don't get Henni's hood. A hoodie draws its own as a `body` box.

## Review

```bash
node tools/guest-sheet.mjs variants/big-hoodie.js <slug>
```

This writes `review/<slug>.png` (walk in, listening, talking, waving, leaving, and the whole studio at site size) and `review/index.html`, and prints the contrast check. Compare against the reference sheet and iterate. Hendrik approves every guest before they go live.
