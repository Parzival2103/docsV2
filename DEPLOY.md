# Deploy — docs.lebytek.com

## VPS (CloudPanel)

| Campo | Valor |
|-------|-------|
| Usuario | `lebytek-docs` |
| Document root | `/home/lebytek-docs/htdocs/docs.lebytek.com` |
| Repo en VPS | `/home/lebytek-docs/repo/docsV2` |
| Nginx | `/etc/nginx/sites-enabled/docs.lebytek.com.conf` |

Nginx ya incluye fallback SPA:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Deploy desde el VPS (recomendado)

```bash
ssh lebytek-vps
sudo -u lebytek-docs bash -lc '
  source ~/.nvm/nvm.sh
  cd ~/repo/docsV2
  git pull origin main
  npm ci
  npm run build
  rsync -a --delete dist/ ~/htdocs/docs.lebytek.com/
'
```

## Deploy desde máquina local (Windows)

Tras `npm run build`:

```powershell
scp -r dist/* lebytek-vps:/home/lebytek-docs/htdocs/docs.lebytek.com/
```

O con el script:

```bash
bash scripts/deploy-vps.sh
```

## Backup del sitio anterior

Antes del cutover, el Docsify anterior se guardó en:

```
/home/lebytek-docs/backups/docsify-site-YYYYMMDD/
/home/lebytek-docs/backups/docsify-YYYYMMDD.tar.gz
```

## Imágenes

Subir capturas a `public/assets/docs/` y referenciar en `src/data.ts`:

- `arquitectura-lebytek.png`
- `qr-instancia.png`
- `instancia-autorizada.png`
- `mensaje-enviado.png`
- `qr-code.png`

Tras añadir imágenes: `npm run build` y redeploy.

## OpenAPI interactivo

La documentación de esta SPA complementa (no reemplaza) el Scribe en:

https://api.lebytek.com/docs

## Sandbox demo (`/#sandbox`)

El sandbox vive en la SPA (React). Llama **directamente** a `api.lebytek.com` desde el navegador del usuario (token del 2º correo demo). Requisitos en la API:

```bash
# En api.lebytek.com VPS — una vez por deploy de /messages o permisos nuevos:
php artisan db:seed --class=RolesAndPermissionsSeeder --force
php artisan tenants:sync-client-permissions
php artisan config:clear

# .env api — CORS para docs:
CORS_ALLOWED_ORIGINS=https://docs.lebytek.com,http://localhost:3000
```

Verificar colas (mensajes transaccionales):

```bash
php artisan horizon:status
php artisan queue:monitor transactional
```

Tras `npm run build`, el sandbox está en `https://docs.lebytek.com/#sandbox`.

**Seguridad:** no hay proxy PHP en docs; el token queda en `sessionStorage` del cliente. Rate limit API: 60 req/min + 10 POST `/messages`/min por tenant.
