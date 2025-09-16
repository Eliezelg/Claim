#!/bin/bash

# Script de mise à jour pour ClaimCompass
# Usage: ./update.sh [branch]

set -e

# Configuration
APP_DIR="/var/www/claimcompass"
BRANCH=${1:-main}
BACKUP_DIR="/var/backups/claimcompass"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Vérification des prérequis
check_prerequisites() {
    if [ ! -d "$APP_DIR" ]; then
        error "Répertoire de l'application introuvable: $APP_DIR"
    fi
    
    if ! command -v git &> /dev/null; then
        error "Git n'est pas installé"
    fi
    
    if ! command -v pm2 &> /dev/null; then
        error "PM2 n'est pas installé"
    fi
}

# Sauvegarde avant mise à jour
backup_before_update() {
    log "Sauvegarde avant mise à jour..."
    
    if [ -f "/usr/local/bin/backup-claimcompass.sh" ]; then
        /usr/local/bin/backup-claimcompass.sh
    else
        warn "Script de sauvegarde non trouvé, création d'une sauvegarde manuelle..."
        mkdir -p "$BACKUP_DIR"
        tar -czf "$BACKUP_DIR/pre_update_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$APP_DIR" .
    fi
}

# Mise à jour du code
update_code() {
    log "Mise à jour du code depuis la branche $BRANCH..."
    
    cd "$APP_DIR"
    
    # Sauvegarder les modifications locales
    git stash push -m "Auto-stash before update $(date)"
    
    # Récupérer les dernières modifications
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    log "Code mis à jour ✓"
}

# Installation des dépendances
install_dependencies() {
    log "Installation des dépendances..."
    
    cd "$APP_DIR"
    npm ci --only=production
    
    log "Dépendances installées ✓"
}

# Build de l'application
build_application() {
    log "Build de l'application..."
    
    cd "$APP_DIR"
    npm run build
    
    # Vérifier que le build a réussi
    if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
        error "Le build a échoué"
    fi
    
    log "Build terminé ✓"
}

# Redémarrage de l'application
restart_application() {
    log "Redémarrage de l'application..."
    
    cd "$APP_DIR"
    
    # Redémarrer avec PM2
    pm2 restart claimcompass
    
    # Attendre que l'application démarre
    sleep 5
    
    # Vérifier que l'application fonctionne
    if pm2 list | grep -q "claimcompass.*online"; then
        log "Application redémarrée avec succès ✓"
    else
        error "Échec du redémarrage de l'application"
    fi
}

# Vérification post-déploiement
post_deployment_check() {
    log "Vérification post-déploiement..."
    
    # Vérifier que l'application répond
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/health" | grep -q "200"; then
        log "Application répond correctement ✓"
    else
        warn "L'application pourrait ne pas répondre correctement"
    fi
    
    # Vérifier les logs récents
    log "Vérification des logs récents..."
    pm2 logs claimcompass --lines 10
}

# Fonction principale
main() {
    log "=== Mise à jour ClaimCompass ==="
    log "Branche: $BRANCH"
    
    check_prerequisites
    backup_before_update
    update_code
    install_dependencies
    build_application
    restart_application
    post_deployment_check
    
    log "=== Mise à jour terminée avec succès ! ==="
}

# Exécution
main "$@"
