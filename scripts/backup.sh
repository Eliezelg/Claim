#!/bin/bash

# Script de sauvegarde automatique pour ClaimCompass
# Usage: ./backup.sh [retention_days]

set -e

# Configuration
APP_DIR="/var/www/claimcompass"
BACKUP_DIR="/var/backups/claimcompass"
RETENTION_DAYS=${1:-30}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="claimcompass_backup_$DATE"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Sauvegarde de l'application
log "Sauvegarde de l'application..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_app.tar.gz" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=uploads \
    -C "$APP_DIR" .

# Sauvegarde des uploads
log "Sauvegarde des uploads..."
if [ -d "$APP_DIR/uploads" ]; then
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" -C "$APP_DIR" uploads
fi

# Sauvegarde de la base de données (si PostgreSQL local)
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == postgresql://*localhost* ]]; then
    log "Sauvegarde de la base de données..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"
fi

# Nettoyage des anciennes sauvegardes
log "Nettoyage des sauvegardes anciennes (>$RETENTION_DAYS jours)..."
find "$BACKUP_DIR" -name "claimcompass_backup_*" -mtime +$RETENTION_DAYS -delete

log "Sauvegarde terminée: $BACKUP_NAME"
log "Taille totale: $(du -sh "$BACKUP_DIR" | cut -f1)"
