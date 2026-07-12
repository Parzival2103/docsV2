#!/bin/bash
set -euo pipefail

POOL=/etc/php/8.3/fpm/pool.d/docs.lebytek.com.conf
CONF=/etc/nginx/sites-enabled/docs.lebytek.com.conf

sudo tee "$POOL" >/dev/null <<'EOF'
[docs.lebytek.com]
listen = 127.0.0.1:16003
user = lebytek-docs
group = lebytek-docs
listen.allowed_clients = 127.0.0.1
pm = ondemand
pm.max_children = 20
pm.process_idle_timeout = 10s
pm.max_requests = 200
listen.backlog = 1024
catch_workers_output = yes
EOF

sudo mkdir -p /home/lebytek-docs/logs/php /home/lebytek-docs/tmp
sudo chown lebytek-docs:lebytek-docs /home/lebytek-docs/logs/php /home/lebytek-docs/tmp

if ! grep -q 'fastcgi_pass 127.0.0.1:16003' "$CONF"; then
  sudo cp "$CONF" "${CONF}.bak-tester-$(date +%Y%m%d%H%M%S)"
  sudo python3 - <<'PY'
from pathlib import Path
path = Path("/etc/nginx/sites-enabled/docs.lebytek.com.conf")
text = path.read_text()
block = """
  location = /tester.php {
    include fastcgi_params;
    fastcgi_intercept_errors on;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_param HTTPS "on";
    fastcgi_param SERVER_PORT 443;
    fastcgi_pass 127.0.0.1:16003;
    fastcgi_param PHP_VALUE "error_log=/home/lebytek-docs/logs/php/error.log;\nmemory_limit=128M;\nmax_execution_time=60;\ndisplay_errors=off;\nsession.save_path=/home/lebytek-docs/tmp;\ndate.timezone=UTC;";
  }

"""
needle = "  location / {"
if "location = /tester.php" in text:
    print("nginx already has tester.php location")
elif needle not in text:
    raise SystemExit("could not find insertion point")
else:
    path.write_text(text.replace(needle, block + needle, 1))
    print("nginx location inserted")
PY
else
  echo "nginx already configured for docs PHP"
fi

sudo nginx -t
sudo systemctl reload php8.3-fpm
sudo systemctl reload nginx
echo "PHP/nginx OK"
