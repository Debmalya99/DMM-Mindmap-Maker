# AGENTS.md

## Project Setup
This repo is a NeutralinoJS desktop app for mindmaps using Vue.js.
- Install dependencies: `npm install`
- The NeutralinoJS CLI is installed as a dev dependency (`@neutralinojs/neu`).

## Development Commands
- Run development server: `npm run dev` (runs `neu run`)
- Build for production: `npm run build` (runs `neu build`)
- Lint: `npm run lint` (if ESLint configured)
- Test: `npm test` (if testing framework configured)

## Project Structure
- `src/` – Application source code (HTML, CSS, JS/TS)
- `resources/` – Static assets (icons, images)
- `neutralino.config.json` – NeutralinoJS configuration
- `package.json` – npm scripts and dependencies

## Technology Choices
- Language: JavaScript (Vue 3)
- UI: Vue 3 framework
- Mindmap rendering: Vue Flow

## Notes
- Follow NeutralinoJS documentation for packaging and distribution.
- Keep `neutralino.config.json` updated with app metadata and features.
- Ensure any build artifacts are excluded from version control (add to .gitignore if using git).
- The app entrypoint is `src/index.html` which loads `src/main.js`.