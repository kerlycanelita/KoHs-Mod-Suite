# KoHs Mod Suite

Website for every approved KoHs Minecraft mod and plugin by Zymery Dria.

Live site: https://kerlycanelita.github.io/KoHs-Mod-Suite/

- Plain HTML/CSS/JS, no build step. GitHub Pages serves the repository root.
- Project data loads live from the [Modrinth API](https://docs.modrinth.com/api/) and READMEs straight from GitHub, so new approved projects and README edits show up automatically. `assets/data/projects.json` is the fallback snapshot; refresh it with `node scripts/update-data.mjs`.
- The request form is delivered by email through [FormSubmit](https://formsubmit.co/). After the first request, confirm FormSubmit's activation email, then replace the address in `CONFIG.formEndpoint` (`assets/js/app.js`) with the random string it sends.
