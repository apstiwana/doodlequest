# Doodle quest

A drawing-to-character game for young children. A child draws something on paper,
photographs or uploads it, and that drawing becomes a character they can move
around a handful of simple scenes — a forest, underwater, a city, the moon and
space.

The goal is practice, not scores: moving the character builds hand-eye
coordination and basic motor control, and the drawing step encourages children to
make something of their own before they play with it. There are no timers, no
losing, and no ads.

**Who it is for:** children roughly aged 4-10, usually alongside an adult for the
photograph/upload step.

**Interface languages:** English and Dutch (`nl`), toggled on the welcome screen.

## How it plays

1. **Welcome** — the child enters their name and picks a language.
2. **Upload** — an adult uploads a photo or scan of the child's drawing.
3. **Customise** — the character's size and colour can be adjusted.
4. **Play** — the character can be moved through a chosen scene, collecting stars
   and reaching a finish line.

Controls are the arrow keys or `A`/`D` on a keyboard, with on-screen buttons on
touch devices.

## Tech stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- Tailwind CSS with [shadcn/ui](https://ui.shadcn.com/) components
- TanStack Query (no router — the game is a single screen)
- Supabase (client SDK plus edge functions)
- Vitest for unit tests, Playwright for end-to-end tests

## Getting started

Requires Node.js 18 or newer and npm.

```sh
# Install dependencies
npm install

# Copy the environment template and fill in your own values
cp .env.example .env

# Start the dev server (http://localhost:8080)
npm run dev
```

`.env` is gitignored. See `.env.example` for the variables the app expects.
Note that every variable is `VITE_`-prefixed, so it is inlined into the browser
bundle and is public by design — never put a secret there.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 8080 |
| `npm run build` | Production build into `dist/` |
| `npm run build:dev` | Build with development mode settings |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |
| `npm test` | Run the Vitest unit tests once |
| `npm run test:watch` | Run the unit tests in watch mode |

### Tests

Unit tests live next to the code in `src/**/*.test.ts(x)` and run under Vitest in
a jsdom environment:

```sh
npm test
```

End-to-end tests are configured for Playwright (`playwright.config.ts`, expecting
specs in `e2e/`). That directory does not exist yet — no end-to-end tests have
been written. Once it does, and once browsers are installed with
`npx playwright install`, run them with `npx playwright test`.

## Project structure

```
index.html                 App shell and page metadata
src/
  main.tsx                 Entry point
  App.tsx                  Providers, plus the one path check the app still needs
  pages/                   Index (the game flow) and NotFound
  components/              Game screens and pieces
    ui/                    shadcn/ui primitives — generated, avoid hand-editing
  context/                 LanguageContext (EN/NL strings)
  hooks/                   Shared React hooks
  integrations/supabase/   Supabase client and generated DB types
  types/                   Game types and scene configuration
  test/                    Vitest setup and tests
  assets/                  Static assets imported by components
public/                    Files served as-is (favicon, robots.txt)
supabase/functions/        Edge functions: character-chat, remove-background, tts
```

## AI features and backend proxy

> **Placeholder — not yet decided.**
>
> The game's AI-backed features (background removal on uploaded drawings,
> character chat, and text-to-speech) currently run as Supabase edge functions.
> The replacement architecture for the AI gateway these functions call is being
> designed separately and is **not documented here yet**.
>
> Do not treat anything currently in `supabase/functions/` as the settled
> design. This section will be filled in once that decision is made.

## Contributing

Before opening a pull request:

```sh
npm run lint
npm test
npm run build
```

Note that `npm run lint` currently reports pre-existing errors in the generated
`src/components/ui/` files and in `tailwind.config.ts`. Those are inherited, not
introduced by recent work — please do not let them grow, but they are not a
blocker for unrelated changes.

## Licence

No licence has been declared for this project yet.
