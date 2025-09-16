#!/bin/bash

# Script de configuration SSL avec Let's Encrypt pour ClaimCompass
# Usage: ./setup-ssl.sh yourdomain.com admin@yourdomain.com

set -e

# Configuration
DOMAIN=${1:-}
EMAIL=${2:-}
APP_NAME="claimcompass"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérification des paramètres
check_parameters() {
    if [ -z "$DOMAIN" ]; then
        error "Usage: $0 <domain> <email>"
        echo "Exemple: $0 yourdomain.com admin@yourdomain.com"
        exit 1
    fi
    
    if [ -z "$EMAIL" ]; then
        error "Usage: $0 <domain> <email>"
        echo "Exemple: $0 yourdomain.com admin@yourdomain.com"
        exit 1
    fi
    
    log "Configuration SSL pour: $DOMAIN"
    log "Email: $EMAIL"
}

# Installation de Certbot
install_certbot() {
    log "Installation de Certbot..."
    
    # Mettre à jour les paquets
    apt update
    
    # Installer snapd si pas déjà installé
    if ! command -v snap &> /dev/null; then
        apt install -y snapd
    fi
    
    # Installer certbot via snap
    snap install core; snap refresh core
    snap install --classic certbot
    
    # Créer un lien symbolique
    ln -sf /snap/bin/certbot /usr/bin/certbot
    
    log "Certbot installé ✓"
}

# Configuration Nginx pour le challenge
setup_nginx_challenge() {
    log "Configuration de Nginx pour le challenge Let's Encrypt..."
    
    # Créer la configuration temporaire pour le challenge
    cat > "/etc/nginx/sites-available/$APP_NAME-ssl" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirection temporaire vers HTTPS (sera activé après SSL)
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # Certificats SSL (seront générés par Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy vers l'application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Fichiers statiques
    location /static/ {
        alias /var/www/$APP_NAME/dist/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Uploads
    location /uploads/ {
        alias /var/www/$APP_NAME/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF
    
    # Activer la configuration
    ln -sf "/etc/nginx/sites-available/$APP_NAME-ssl" "/etc/nginx/sites-enabled/"
    
    # Supprimer l'ancienne configuration
    rm -f "/etc/nginx/sites-enabled/$APP_NAME"
    
    # Tester la configuration
    nginx -t
    
    # Recharger Nginx
    systemctl reload nginx
    
    log "Configuration Nginx mise à jour ✓"
}

# Génération du certificat SSL
generate_ssl_certificate() {
    log "Génération du certificat SSL avec Let's Encrypt..."
    
    # Créer le répertoire pour le challenge
    mkdir -p /var/www/html
    
    # Générer le certificat
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/html \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,www.$DOMAIN"
    
    log "Certificat SSL généré ✓"
}

# Configuration du renouvellement automatique
setup_auto_renewal() {
    log "Configuration du renouvellement automatique..."
    
    # Tester le renouvellement
    certbot renew --dry-run
    
    # Ajouter une tâche cron pour le renouvellement automatique
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    
    log "Renouvellement automatique configuré ✓"
}

# Mise à jour de la configuration Nginx finale
update_nginx_final() {
    log "Mise à jour de la configuration Nginx finale..."
    
    # Recharger Nginx pour activer HTTPS
    systemctl reload nginx
    
    # Vérifier que tout fonctionne
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200\|301\|302"; then
        log "HTTPS fonctionne correctement ✓"
    else
        warn "HTTPS pourrait ne pas fonctionner correctement. Vérifiez la configuration."
    fi
}

# Fonction principale
main() {
    log "=== Configuration SSL ClaimCompass ==="
    
    check_parameters
    install_certbot
    setup_nginx_challenge
    generate_ssl_certificate
    setup_auto_renewal
    update_nginx_final
    
    log "=== Configuration SSL terminée avec succès ! ==="
    log "Votre site est maintenant disponible en HTTPS: https://$DOMAIN"
    log "Le certificat sera renouvelé automatiquement."
    
    # Afficher les informations utiles
    echo ""
    echo "=== Informations utiles ==="
    echo "• Certificat: /etc/letsencrypt/live/$DOMAIN/"
    echo "• Renouvellement: certbot renew"
    echo "• Logs: /var/log/letsencrypt/"
    echo "• Test: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
}

# Exécution
main "$@"
