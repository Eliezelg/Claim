#!/bin/bash

# Script de déploiement ClaimCompass avec PostgreSQL sur VPS
# Usage: ./deploy-with-postgresql.sh [environment] [domain]
# Exemple: ./deploy-with-postgresql.sh production yourdomain.com

set -e

# Configuration
ENVIRONMENT=${1:-production}
DOMAIN=${2:-}
APP_NAME="claimcompass"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_FILE="/var/log/$APP_NAME/deploy.log"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Vérification des prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier si on est root ou sudo
    if [[ $EUID -ne 0 ]]; then
        error "Ce script doit être exécuté en tant que root ou avec sudo"
    fi
    
    # Mettre à jour les paquets
    apt update
    
    # Installer les dépendances de base
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    # Node.js 18+
    if ! command -v node &> /dev/null; then
        log "Installation de Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    fi
    
    # Nginx
    if ! command -v nginx &> /dev/null; then
        log "Installation de Nginx..."
        apt install -y nginx
    fi
    
    # PM2
    if ! command -v pm2 &> /dev/null; then
        log "Installation de PM2..."
        npm install -g pm2
    fi
    
    # PostgreSQL
    if ! command -v psql &> /dev/null; then
        log "Installation de PostgreSQL..."
        apt install -y postgresql postgresql-contrib
        systemctl start postgresql
        systemctl enable postgresql
    fi
    
    log "Prérequis vérifiés ✓"
}

# Configuration du firewall
setup_firewall() {
    log "Configuration du firewall..."
    
    # Installer ufw si pas déjà installé
    apt install -y ufw
    
    # Configuration de base
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Ports nécessaires
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    
    # Activer le firewall
    ufw --force enable
    
    log "Firewall configuré ✓"
}

# Installation et configuration de PostgreSQL
setup_postgresql() {
    log "Configuration de PostgreSQL..."
    
    # Exécuter le script de configuration PostgreSQL
    if [ -f "/tmp/claimcompass-deploy/scripts/setup-postgresql.sh" ]; then
        chmod +x /tmp/claimcompass-deploy/scripts/setup-postgresql.sh
        /tmp/claimcompass-deploy/scripts/setup-postgresql.sh claimcompass claimcompass
    else
        warn "Script setup-postgresql.sh non trouvé, configuration manuelle..."
        
        # Configuration manuelle de base
        sudo -u postgres psql << EOF
CREATE USER claimcompass WITH PASSWORD '$(openssl rand -base64 32)';
CREATE DATABASE claimcompass OWNER claimcompass;
GRANT ALL PRIVILEGES ON DATABASE claimcompass TO claimcompass;
\q
EOF
    fi
    
    log "PostgreSQL configuré ✓"
}

# Création des répertoires
setup_directories() {
    log "Création des répertoires..."
    
    mkdir -p "$APP_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "/var/log/$APP_NAME"
    mkdir -p "/var/www/$APP_NAME/uploads"
    mkdir -p "/var/backups/postgresql"
    
    # Permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    log "Répertoires créés ✓"
}

# Sauvegarde de la version précédente
backup_current() {
    if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
        log "Sauvegarde de la version actuelle..."
        
        BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$APP_DIR" .
        
        # Garder seulement les 5 dernières sauvegardes
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm
        
        log "Sauvegarde créée: $BACKUP_NAME ✓"
    fi
}

# Installation des dépendances
install_dependencies() {
    log "Installation des dépendances..."
    
    cd "$APP_DIR"
    
    # Copier package.json et package-lock.json
    cp /tmp/claimcompass-deploy/package*.json ./
    
    # Installation des dépendances
    npm ci --only=production
    
    log "Dépendances installées ✓"
}

# Build de l'application
build_application() {
    log "Build de l'application..."
    
    cd "$APP_DIR"
    
    # Build frontend et backend
    npm run build
    
    # Vérifier que le build a réussi
    if [ ! -d "dist" ]; then
        error "Le build a échoué - dossier dist manquant"
    fi
    
    if [ ! -f "dist/index.js" ]; then
        error "Le build a échoué - fichier dist/index.js manquant"
    fi
    
    log "Build terminé ✓"
}

# Configuration des variables d'environnement
setup_environment() {
    log "Configuration des variables d'environnement..."
    
    if [ ! -f "$APP_DIR/.env" ]; then
        if [ -f "$APP_DIR/.env.example" ]; then
            cp "$APP_DIR/.env.example" "$APP_DIR/.env"
            
            # Mettre à jour l'URL de la base de données
            if grep -q "your-generated-password" "$APP_DIR/.env"; then
                # Récupérer le mot de passe depuis PostgreSQL
                DB_PASSWORD=$(sudo -u postgres psql -t -c "SELECT rolpassword FROM pg_authid WHERE rolname='claimcompass';" | tr -d ' ')
                if [ -n "$DB_PASSWORD" ]; then
                    sed -i "s/your-generated-password/$DB_PASSWORD/g" "$APP_DIR/.env"
                fi
            fi
            
            warn "Fichier .env créé - Vérifiez les valeurs !"
        else
            error "Fichier .env manquant et .env.example introuvable"
        fi
    fi
    
    # Mettre à jour le domaine si fourni
    if [ -n "$DOMAIN" ]; then
        sed -i "s/yourdomain.com/$DOMAIN/g" "$APP_DIR/.env"
        sed -i "s/https:\/\/yourdomain.com/https:\/\/$DOMAIN/g" "$APP_DIR/.env"
    fi
    
    log "Variables d'environnement configurées ✓"
}

# Configuration de la base de données
setup_database() {
    log "Configuration de la base de données..."
    
    cd "$APP_DIR"
    
    # Exécuter les migrations
    if [ -f "package.json" ] && grep -q "db:push" package.json; then
        npm run db:push
        log "Migrations exécutées ✓"
    else
        warn "Aucune migration trouvée"
    fi
}

# Configuration Nginx
setup_nginx() {
    log "Configuration de Nginx..."
    
    # Créer la configuration Nginx
    cat > "/etc/nginx/sites-available/$APP_NAME" << EOF
server {
    listen 80;
    server_name ${DOMAIN:-_} www.${DOMAIN:-_};
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
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
        alias $APP_DIR/dist/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Uploads
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF
    
    # Activer le site
    ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"
    
    # Supprimer le site par défaut
    rm -f /etc/nginx/sites-enabled/default
    
    # Tester la configuration
    nginx -t
    
    # Recharger Nginx
    systemctl reload nginx
    
    log "Nginx configuré ✓"
}

# Démarrage avec PM2
start_application() {
    log "Démarrage de l'application avec PM2..."
    
    cd "$APP_DIR"
    
    # Arrêter l'application si elle tourne
    pm2 stop "$APP_NAME" 2>/dev/null || true
    pm2 delete "$APP_NAME" 2>/dev/null || true
    
    # Démarrer l'application
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"
    
    # Sauvegarder la configuration PM2
    pm2 save
    pm2 startup
    
    log "Application démarrée ✓"
}

# Configuration des sauvegardes automatiques
setup_automatic_backups() {
    log "Configuration des sauvegardes automatiques..."
    
    # Copier les scripts de sauvegarde
    if [ -f "/tmp/claimcompass-deploy/scripts/backup.sh" ]; then
        cp /tmp/claimcompass-deploy/scripts/backup.sh /usr/local/bin/backup-claimcompass.sh
        chmod +x /usr/local/bin/backup-claimcompass.sh
    fi
    
    if [ -f "/tmp/claimcompass-deploy/scripts/backup-postgresql.sh" ]; then
        cp /tmp/claimcompass-deploy/scripts/backup-postgresql.sh /usr/local/bin/backup-postgresql.sh
        chmod +x /usr/local/bin/backup-postgresql.sh
    fi
    
    # Ajouter les tâches cron
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-claimcompass.sh") | crontab -
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-postgresql.sh") | crontab -
    
    log "Sauvegardes automatiques configurées ✓"
}

# Configuration SSL (optionnel)
setup_ssl() {
    if [ -n "$DOMAIN" ]; then
        log "Configuration SSL pour $DOMAIN..."
        
        if [ -f "/tmp/claimcompass-deploy/setup-ssl.sh" ]; then
            chmod +x /tmp/claimcompass-deploy/setup-ssl.sh
            /tmp/claimcompass-deploy/setup-ssl.sh "$DOMAIN" "admin@$DOMAIN"
        else
            warn "Script SSL non trouvé, configuration manuelle nécessaire"
        fi
    else
        warn "Domaine non fourni, SSL non configuré"
    fi
}

# Vérification finale
final_verification() {
    log "Vérification finale..."
    
    # Vérifier que l'application répond
    sleep 5
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200\|301\|302"; then
        log "Application répond correctement ✓"
    else
        warn "L'application pourrait ne pas répondre correctement"
    fi
    
    # Vérifier PostgreSQL
    if psql -h localhost -U claimcompass -d claimcompass -c "SELECT 1;" > /dev/null 2>&1; then
        log "PostgreSQL fonctionne correctement ✓"
    else
        warn "PostgreSQL pourrait ne pas fonctionner correctement"
    fi
    
    # Afficher les informations utiles
    echo ""
    echo "=========================================="
    echo "DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
    echo "=========================================="
    echo "Application: http://$(hostname -I | awk '{print $1}')"
    if [ -n "$DOMAIN" ]; then
        echo "Domaine: http://$DOMAIN"
    fi
    echo "Logs: pm2 logs $APP_NAME"
    echo "Statut: pm2 status"
    echo "PostgreSQL: psql -h localhost -U claimcompass -d claimcompass"
    echo "=========================================="
}

# Fonction principale
main() {
    log "=== Déploiement ClaimCompass avec PostgreSQL ==="
    log "Environnement: $ENVIRONMENT"
    if [ -n "$DOMAIN" ]; then
        log "Domaine: $DOMAIN"
    fi
    
    check_prerequisites
    setup_firewall
    setup_postgresql
    setup_directories
    backup_current
    install_dependencies
    build_application
    setup_environment
    setup_database
    setup_nginx
    start_application
    setup_automatic_backups
    setup_ssl
    final_verification
}

# Exécution
main "$@"
