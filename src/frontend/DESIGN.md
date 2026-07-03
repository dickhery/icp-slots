# Neon Casino Vault — Design Brief

## Direction
A dark, warm-charcoal slot cabinet that feels like a high-roller vault after
hours. Red-magenta neon drives the action; gold accents mark value and wins.
The single centered cabinet is the hero — everything else recedes into shadow.

## Tone
Confident, playful, premium. Casino energy without kitsch. Numbers (ICP
amounts, payouts) are precise and mono-spaced; headlines are geometric and
bold. Copy is short and verb-first ("Spin", "Cash out").

## Differentiation
Most slot UIs are loud and cluttered. This vault is restrained: one focal
cabinet, generous negative space, a grain texture that reads as felt-meets-
metal. Gold glow is reserved for wins and value — never decoration.

## Color Palette
| Token        | OKLCH              | Use                              |
|--------------|--------------------|----------------------------------|
| background   | 0.14 0.015 50      | Page, behind cabinet             |
| card         | 0.185 0.018 50      | Cabinet body, panels             |
| primary      | 0.62 0.24 25        | Spin button, active states       |
| accent       | 0.82 0.16 80       | Wins, gold highlights, value     |
| success      | 0.7 0.18 150       | Payout confirmations             |
| warning      | 0.78 0.15 70       | Low-balance, admin cautions      |
| destructive  | 0.58 0.24 25       | Destructive admin actions        |
| muted-fg     | 0.62 0.015 55      | Secondary text, labels           |

## Typography
- **Display** — Space Grotesk (400–700): headlines, cabinet title, buttons.
- **Body** — DM Sans (400–700): paragraphs, labels, admin copy.
- **Mono** — Geist Mono (400–600): ICP amounts, balances, payouts, addresses.

## Elevation & Depth
- `shadow-elevated` — panels and cards lifted off the charcoal.
- `shadow-cabinet` — inset reel wells + outer drop for the cabinet frame.
- `shadow-gold` / `shadow-gold-lg` — win states and gold-accented CTAs.
- `shadow-primary` — spin button resting glow.

## Structural Zones
- **Header** — `bg-card`, `border-b`, subtle: brand mark + balance chip.
- **Cabinet (hero)** — `bg-background` with radial neon wash; centered cabinet
  uses `bg-card` + `shadow-cabinet`. Reels sit in `reel-edge` wells.
- **Sections** — alternate `bg-background` and `bg-muted/30` for paytable,
  admin vault, history.
- **Footer** — `bg-card`, `border-t`, branding line.

## Spacing & Rhythm
Section padding `py-16 md:py-24`. Cabinet max-width `max-w-3xl`, centered.
Reel gaps `gap-2 md:gap-3`. Form fields `space-y-4`. Buttons `gap-3`.

## Component Patterns
- **Spin button** — large, primary, `shadow-primary`, `animate-pulse-glow` at
  rest, label "Spin · 0.01 ICP".
- **Reel** — `reel-edge` well, `font-display` symbols, `animate-reel-spin`
  while spinning, `animate-win-flash` on win.
- **Balance chip** — `bg-secondary`, `font-mono`, gold amount.
- **Payout toast** — `success` border, `animate-coin-drop` coin icon.
- **Admin transfer** — `warning` outlined card, mono address input.

## Motion
- Reels: `animate-reel-spin` (linear, 0.12s loop) during spin.
- Wins: `animate-win-flash` (2 iterations) + `animate-coin-drop` on payout.
- Buttons: `transition-smooth`, hover lifts shadow.
- `prefers-reduced-motion` collapses all durations to 0.01ms.

## Constraints
- Single payline, fixed 0.01 ICP spin — no bet controls in UI.
- No leaderboard, no top-winners list.
- Gold glow only on wins and value surfaces — never decorative.
- All colors via OKLCH tokens; no raw hex/rgb in components.

## Signature Detail
The cabinet frame: `shadow-cabinet` inset wells + outer drop, gold hairline
`border-accent/30`, and a faint `vault-grain` overlay — reads as brushed metal
under vault lighting. On a win, the gold hairline pulses via `win-flash`.
