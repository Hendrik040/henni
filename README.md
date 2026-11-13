# Henni

The voxel pet who lives on [krackedtools.dev](https://krackedtools.dev): a tiny 3D me who walks in through a door, follows your cursor and works through his day. He codes, records my podcast with real guests, surfs, skis and falls asleep on the couch. [TypeSafe's Jev](https://typesafe.ai) decides what he does next.

One dependency-free file, `pet.js`, plain ES5, drawn by its own little software rasterizer. No WebGL, no libraries, no build step needed to use it.

## What he does

- **Arrives** after 10 seconds on the site (counted across pages, per tab): a door grows out of the floor, he steps out, it sinks away.
- **Lives through his day.** The longer the visit, the further it goes: walking → coding → podcast → surfing → saxophone → cocktails → skiing → kitesurfing → asleep on the couch. Click him to skip ahead, or to wake him.
- **Sits down when your cursor rests:** coding at two big screens while four terminals tell one story; recording The Merge podcast; mixing a martini, an old fashioned and a cuba libre at the bar. On skis he hits kickers and rails.
- **Goes his own way.** Now and then he stops following and walks off on a path of his own: he pulls up a drinks crate and hangs out with a Club-Mate for most of a minute, cartwheels across the page, or dances. Then he comes back to your cursor, and his day carries on where it left off.
- **Hosts real guests.** Sixteen guests of [The Merge](https://krackedtools.dev/podcasts.html) take turns walking into his studio, each hand-sculpted from their episode (`guests/`). A name tag shows as they sit, and clicking one opens their episode.
- **Thinks with Jev.** Every 25 seconds a small snapshot of the visit goes to `jev/jev-proxy.mjs`, which asks Jev which activity comes next and which guest fits what you're reading. Without an answer he keeps his own timetable.
- **Leaves when asked.** Hover him for "send Henni home" (he waves and walks into a door for the rest of the visit) or "pin Henni here".

Mouse or trackpad only, and hidden when your system asks for reduced motion.

## How he's drawn

A z-buffered software rasterizer at about one art pixel per voxel, on a 128×90 canvas scaled up 3× pixel-sharp. Light comes from the top-left; each face picks a step from a hand-built colour ramp, part-ID creases separate overlapping parts, and the top and left contour is raised one step. Henni's fills stay at 3:1 contrast or better on the site's background, `#131118`. Fine details (terminal text, glasses at the bar) go on a 2× overlay canvas.

## Use him on a page

Put `pet.js` and `pet-guests.js` side by side and add one line before `</body>`:

```html
<script defer src="pet.js"></script>
```

He's drawn for a dark page. A few scenes know krackedtools.dev's pages (resting on an episode in its podcast list opens the studio); elsewhere they simply don't trigger. He only calls the Jev proxy on krackedtools.dev and on localhost, so anywhere else he keeps to his timetable.

## Work on him

```bash
npm run lab     # http://localhost:8765: the lab swaps variants, jumps to any part of his day or sends him off on an outing
npm run build   # variants/big-hoodie.js → colourways → pet.js, and guests/ → pet-guests.js
npm test        # the Jev proxy, the guest studio, the Jev brain and his outings, all offline
```

| Path | What it is |
| --- | --- |
| `variants/big-hoodie.js` | The source. Start every change here. |
| `tools/colorways.py` | Generates the colourways (`bh-ink`, `bh-midnight`, `bh-signal`, `bh-ringer`); Ink ships. |
| `tools/build-pet.mjs` | Writes `pet.js`: its header comment plus the Ink build. |
| `guests/` | One file per guest, the catalogue `merge-guests.json`, and [how a guest is made](guests/README.md). |
| `tools/build-guests.mjs` | Trial-renders every guest, then writes `pet-guests.js`. |
| `tools/*-test.mjs`, `tools/*-sheet.mjs` | Behaviour checks in Node with a faked page and clock, and PNG sheets for reviewing scenes and guests. |
| `jev/` | The Jev proxy, its tests and a Railway deploy script. |
| `demo.html` | A plain page to see him on. |

The older variants (`crossy-chibi`, `ink-and-gold`, `_base-v3`) are earlier takes on him, kept for the lab.

## The Jev proxy

`jev/jev-proxy.mjs` is a small Node server with no dependencies. The browser sends a snapshot of the visit: the page, the pages read before it, scroll and idle times, the local hour and time zone, the episode under the cursor and what Henni has done so far. It never includes typed text, cookies or an identifier ([privacy policy](https://krackedtools.dev/privacy.html)). The proxy owns the API key and a fixed set of typed questions, so the key never reaches the page and nobody can ask questions of their own. It limits each visitor, caps real Jev calls per day, and answers from simple rules (marked `"mock": true`) when there's no key or the cap is reached.

```bash
TYPESAFE_API_KEY=... npm run jev                   # or put the key in .env
RAILWAY_PROJECT=<project id> bash jev/deploy.sh    # deploy to Railway
```

Settings: `JEV_ORIGINS` (comma-separated origins allowed to call it), `JEV_DAILY_CAP` (default 25000), `JEV_MODEL` (default `jev-latest`).

## License

The code is MIT; see [LICENSE](LICENSE). Henni and the guests are likenesses of real people (me, and the guests of The Merge). The license covers the code, not their likenesses.
