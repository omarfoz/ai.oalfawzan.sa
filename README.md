# ai.oalfawzan.sa

Interactive visual timeline explaining the modern AI application layer:

- 2022: ChatGPT / prompt interface
- 2023: Context engineering and RAG adoption
- 2024: Agents and tool loops
- 2025: Agentic coding
- 2026: Harness engineering

## Design

The site is part of the `oalfawzan.sa` ecosystem and shares the main portfolio's visual language: liquid-glass surfaces, blue atmospheric background, system typography, rounded controls, responsive spacing, and dark/light themes.

The AI-specific educational identity is intentionally preserved inside the experience through dark digital-blackboard diagrams, hand-drawn visual explanations, semantic stage colors, the timeline, and interactive system labs.

Shared ecosystem styling is isolated in:

- `ecosystem.css`: design tokens, liquid-glass shell, typography, responsive behavior, accessibility states, and cross-site visual alignment.
- `ecosystem.js`: shared dark/light theme behavior using the `oalfawzan-theme` storage key.

The original `styles.css`, `mobile.css`, `enhancements.css`, `script.js`, and `enhancements.js` continue to provide the AI site's feature and interaction layer.

## Tech

Static HTML + CSS + JavaScript only. No build step and no framework.

## GitHub Pages

1. Push the repository to GitHub.
2. Enable GitHub Pages for the `main` branch / root, or use your preferred static host.
3. The included `CNAME` file declares `ai.oalfawzan.sa`.
4. Configure public DNS for your hosting provider.

## Local preview

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Visual QA targets

Before deployment, review the full page at these viewport sizes:

- 1920 x 1080
- 1440 x 900
- 768 x 1024
- 390 x 844

Check for horizontal overflow, clipped content, navigation wrapping, card alignment, typography, glass contrast, and interactive lab usability in both dark and light themes.

## Timeline note

The years represent adoption waves in the modern LLM application layer, not the invention date of every technique. RAG, for example, predates ChatGPT.
