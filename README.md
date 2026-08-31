# ai.oalfawzan.sa

Interactive visual timeline explaining the modern AI application layer:

- 2022 — ChatGPT / prompt interface
- 2023 — Context engineering and RAG adoption
- 2024 — Agents and tool loops
- 2025 — Agentic coding
- 2026 — Harness engineering

## Design

The site uses an original digital-blackboard visual language inspired by educational sketch explanations:
dark background, hand-drawn SVG diagrams, animated timeline nodes, and scroll-driven storytelling.

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

## Timeline note

The years represent adoption waves in the modern LLM application layer, not the invention date of every technique.
RAG, for example, predates ChatGPT.
