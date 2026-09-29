# KoHs Mod Suite

Website for every approved KoHs Minecraft mod and plugin by Zymery Dria.

Live site: https://kerlycanelita.github.io/KoHs-Mod-Suite/

- Plain HTML/CSS/JS, no build step. GitHub Pages serves the repository root.
- Project data loads live from the [Modrinth API](https://docs.modrinth.com/api/) and READMEs straight from GitHub, so new approved projects and README edits show up automatically. `assets/data/projects.json` is the fallback snapshot; refresh it with `node scripts/update-data.mjs`.
- The request form is delivered by email through [FormSubmit](https://formsubmit.co/). After the first request, confirm FormSubmit's activation email, then set `CONFIG.formEndpoint` (`assets/js/app.js`) to `https://formsubmit.co/<random string>` with the string it sends.
- Security: a Content-Security-Policy limits scripts to the site's own files and form posts to FormSubmit; Modrinth, GitHub and Discord content is sanitized (https links only, sandboxed video embeds); attachments are limited to images, PDF and text/log/config files, 5 files and 10 MB in total; spam is filtered with FormSubmit's reCAPTCHA, a honeypot field and a one-minute cooldown.
