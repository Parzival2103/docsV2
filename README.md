# docs.lebytek.com (docsV2)

Documentación pública de **Lebytek API** — MVP WhatsApp en `api.lebytek.com`.

Sitio estático SPA (React + Vite + Tailwind). El contenido vive en `src/data.ts`.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir: http://localhost:3000

No requiere `GEMINI_API_KEY` para desarrollo ni producción (dependencia legacy del template AI Studio).

## Build producción

```bash
npm run build
npm run preview   # opcional, ver dist en :4173
```

Salida: `dist/` (servir como estáticos).

## Estructura

```
src/data.ts          Contenido markdown por sección
src/components/      Sidebar, DocViewer (copiar código)
public/assets/docs/  Capturas (placeholders referenciados en data.ts)
```

## Secciones (MVP API)

- **Primeros Pasos:** Introducción, Guía de inicio rápido
- **Referencia API:** Autenticación, Tenants, Instancias, Mensajes

Framework, portal waapi y tenants a medida: iteración posterior.

## Deploy

Ver [DEPLOY.md](DEPLOY.md).

## Repo anterior (Docsify)

El sitio Docsify multi-sección (`api/`, `framework/`, `tenants/`) quedó respaldado en el VPS en `/home/lebytek-docs/backups/`.

Repositorio legacy local: `docs.lebytek.com` (sibling en Desktop/sistemas).
