#!/bin/bash

# Script de déploiement ClaimCompass pour VPS
# Usage: ./deploy.sh [environment]
# Exemple: ./deploy.sh production

set -e

# Configuration
ENVIRONMENT=${1:-production}
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
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé. Installez Node.js 18+ d'abord."
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        error "npm n'est pas installé."
    fi
    
    # Vérifier PM2
    if ! command -v pm2 &> /dev/null; then
        warn "PM2 n'est pas installé. Installation..."
        npm install -g pm2
    fi
    
    # Vérifier Nginx
    if ! command -v nginx &> /dev/null; then
        warn "Nginx n'est pas installé. Installation..."
        apt update && apt install -y nginx
    fi
    
    # Vérifier PostgreSQL
    if ! command -v psql &> /dev/null; then
        warn "PostgreSQL n'est pas installé. Installation..."
        apt update && apt install -y postgresql postgresql-contrib
        systemctl start postgresql
        systemctl enable postgresql
    fi
    
    log "Prérequis vérifiés ✓"
}

# Création des répertoires
setup_directories() {
    log "Création des répertoires..."
    
    mkdir -p "$APP_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "/var/log/$APP_NAME"
    mkdir -p "/var/www/$APP_NAME/uploads"
    
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
            warn "Fichier .env créé depuis .env.example - Vérifiez les valeurs !"
        else
            error "Fichier .env manquant et .env.example introuvable"
        fi
    fi
    
    # Vérifier si PostgreSQL est configuré
    if ! grep -q "postgresql://" "$APP_DIR/.env"; then
        warn "PostgreSQL non configuré dans .env - Exécutez setup-postgresql.sh d'abord"
    fi
    
    log "Variables d'environnement configurées ✓"
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

# Configuration Nginx
setup_nginx() {
    log "Configuration de Nginx..."
    
    # Créer la configuration Nginx
    cat > "/etc/nginx/sites-available/$APP_NAME" << EOF
server {
    listen 80;
    server_name _;
    
    # Redirection vers HTTPS (sera activé après SSL)
    # return 301 https://\$server_name\$request_uri;
    
    # Configuration temporaire pour HTTP
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

# Fonction principale
main() {
    log "=== Déploiement ClaimCompass ==="
    log "Environnement: $ENVIRONMENT"
    
    check_prerequisites
    setup_directories
    backup_current
    install_dependencies
    build_application
    setup_environment
    setup_nginx
    start_application
    
    log "=== Déploiement terminé avec succès ! ==="
    log "Application disponible sur: http://$(hostname -I | awk '{print $1}')"
    log "Logs: pm2 logs $APP_NAME"
    log "Status: pm2 status"
}

# Exécution
main "$@"
