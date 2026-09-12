# ACTA — phone client

Designed for a 360–430px viewport first, centred in a device frame on wider
screens. The server owns the action loop; this app states goals, shows the loop
running, and collects approvals.

Needs the backend running — see the [project README](../README.md).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
npm run lint
```

## Structure

Four tabs, because a new user should never have to guess which one holds their
money.

| Tab | Answers |
| --- | --- |
| **Home** | Who am I, what needs me right now, and what has the agent spent today? |
| **Tasks** | What have I asked for, and what did the agent do about it? (History is the audit log.) |
| **Approvals** | What is waiting on my decision? |
| **Settings** | My profile, the agent's limits, appearance, and what ACTA is. |

The nav is four icons in a strip of frosted circles, with a white puck that
springs to whichever is current — no labels, because four icons are learned
once.

Everything else is reached from those: `/new` composes a task, `/run/:id` is one
task in detail, `/limits` and `/about` sit under Settings. Old paths (`/agent`,
`/activity`, `/policy`) redirect.

## Fonts

**Florentino** sets the display type — titles, headlines, money. It is a
commercial face from Harmonais Visual, so the licensed web files are not in the
repo: drop them into [`public/fonts/`](public/fonts/README.md) and they are
picked up automatically. Until then Cormorant Garamond stands in, a Renaissance
serif of similar colour, so nothing looks broken.

**Jost** carries everything read at small sizes — labels, buttons, body copy —
because a calligraphic serif is not legible at 12px.

## Design

**Pearl & Obsidian** — frosted mother-of-pearl over a slow iridescent wash, in
light and dark, following the system until someone picks it in Settings. The
accent is graphite rather than a colour: the interface leans on contrast, and
keeps colour for what money is doing (jade approved, amber asking, oxblood
stopped).

Two rules keep it aligned: every measure comes from the spacing scale at the top
of `src/design.css`, and everything on a screen aligns to one left rail
(`--gutter`). Radius encodes hierarchy — 26px panels, 18px rows, pill controls.

Motion is spent where it means something:

- **Hold to pay** — authorising money takes a deliberate 900ms gesture with a
  fill that shows how far through it you are. Commitment is a timer and the fill
  is a CSS transition, so a throttled frame loop can't leave it dead.
- **Push transitions** between screens, following the direction you travelled.
- **The loop lands** — each step's tick draws itself and the rail fills downward.
- **Amounts count up** rather than blinking into place.
- A sliding tab indicator, a breathing dot on live work, staggered list entrances.

All of it collapses under `prefers-reduced-motion`.
