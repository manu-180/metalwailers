# Fogoneros MW: panel y bot de WhatsApp

Bot de ventas para los fogoneros de Santi (tío de Manuel) y panel para él y Claudia. No es un
producto de Metal Wailers: sólo usa su dominio y vive en este repo, en `fogoneros/`, al lado del sitio Flutter.
Leé también `AGENTS.md` (Next 16 cambia APIs) y `docs/PROGRESS.md`.

## Mapa

| Cosa | Dónde |
|---|---|
| Producción | Vercel `fogoneros-app` (team de manu-180), Root Directory `fogoneros`, dominio app.metalwailers.com |
| Base | Supabase `ktmbtpuhqqofdkisqseq`, compartido: tablas `fg_*`, bucket privado `fogoneros` |
| WhatsApp | Instancia `fogoneros-mw` del Evolution compartido con los closers |
| Secretos | envkit `fogoneros-mw` (`.envkit` en esta carpeta). En local: `envkit run -- npx next dev` |
| Modelo | `claude-opus-5-5`, effort low; override con `BOT_MODELO` |

## Invariantes

- El proyecto de Supabase lo comparten otras apps con signups abiertos: tener sesión no alcanza, todo pasa por `fg_es_equipo()`. Nunca un `using (true)` ni una tabla sin prefijo `fg_`.
- En el Evolution compartido sólo se toca `EVOLUTION_INSTANCE`.
- `after()` y el debounce de 7 s responden; el cron de 5 min levanta lo que quedó `pendiente`. Un turno por chat con `fg_tomar_turno`.
- Si Claudia escribe desde el teléfono o el panel, el bot se calla en ese chat hasta que lo reactiven.
- El bot nunca inventa precios, medidas, stock ni plazos: lo que no está en `fg_contexto` pasa a Claudia.
- Webhook autenticado sólo por el header `x-fg-token`. `webhookByEvents`/`webhookBase64` no existen en 2.3.7: son `byEvents`/`base64`.
- Autor de commits: `157671390+manu-180@users.noreply.github.com`.

## Comandos

`npx vitest run` · `npx tsc --noEmit` · `npx eslint src` · `envkit run -- npx next build`
