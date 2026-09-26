# KoHs Mod Suite

Website for every approved KoHs Minecraft mod and plugin by Zymery Dria.

Live site: https://kerlycanelita.github.io/KoHs-Mod-Suite/

- Plain HTML/CSS/JS, no build step. GitHub Pages serves the repository root.
- Project data loads live from the [Modrinth API](https://docs.modrinth.com/api/). `assets/data/projects.json` is a snapshot the site falls back to; refresh it with `node scripts/update-data.mjs`.
- New projects approved on Modrinth show up automatically.
