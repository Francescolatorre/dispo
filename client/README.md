# Dispo – Client

React 18 + TypeScript + Chakra UI 2 (Vite). Überblick, Schnellstart, Datenquellen, Tests und
bekannte Einschränkungen stehen im [README im Wurzelverzeichnis](../README.md); die Feature-Liste in
[docs/COMPLETE_FEATURE_LIST.md](../docs/COMPLETE_FEATURE_LIST.md).

```bash
npm install
npm run dev          # http://localhost:5173 (VITE_DATA_SOURCE=auto|api|local)
npx vitest run       # Unit- und Komponententests (npm test = Watch-Modus)
npm run typecheck
npm run lint
npm run build
npm run test:e2e     # Playwright-Smoke-Tests (einmalig: npx playwright install chromium)
```
