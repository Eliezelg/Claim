#!/bin/bash

# Script de sauvegarde PostgreSQL pour ClaimCompass
# Usage: ./backup-postgresql.sh [retention_days]

set -e

# Configuration
DB_NAME="claimcompass"
DB_USER="claimcompass"
BACKUP_DIR="/var/backups/postgresql"
RETENTION_DAYS=${1:-30}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="claimcompass_postgresql_$DATE"

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

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump n'est pas installé"
    fi
    
    if ! command -v psql &> /dev/null; then
        error "psql n'est pas installé"
    fi
}

# Créer le répertoire de sauvegarde
setup_backup_directory() {
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"
}

# Sauvegarde complète de la base de données
backup_database() {
    log "Sauvegarde de la base de données PostgreSQL..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}.sql"
    local compressed_file="${backup_file}.gz"
    
    # Sauvegarde avec pg_dump
    if pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --create \
        > "$backup_file" 2>/dev/null; then
        
        success "Sauvegarde SQL créée: $backup_file"
    else
        error "Échec de la sauvegarde SQL"
    fi
    
    # Compresser la sauvegarde
    if gzip "$backup_file"; then
        success "Sauvegarde compressée: $compressed_file"
    else
        error "Échec de la compression"
    fi
    
    # Vérifier la taille
    local size=$(du -h "$compressed_file" | cut -f1)
    log "Taille de la sauvegarde: $size"
}

# Sauvegarde des données uniquement (plus rapide)
backup_data_only() {
    log "Sauvegarde des données uniquement..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}_data.sql"
    local compressed_file="${backup_file}.gz"
    
    # Sauvegarde des données uniquement
    if pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --data-only \
        --no-owner \
        --no-privileges \
        > "$backup_file" 2>/dev/null; then
        
        success "Sauvegarde des données créée: $backup_file"
    else
        error "Échec de la sauvegarde des données"
    fi
    
    # Compresser
    gzip "$backup_file"
    local size=$(du -h "$compressed_file" | cut -f1)
    log "Taille de la sauvegarde des données: $size"
}

# Sauvegarde des schémas uniquement
backup_schema_only() {
    log "Sauvegarde des schémas uniquement..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}_schema.sql"
    local compressed_file="${backup_file}.gz"
    
    # Sauvegarde des schémas uniquement
    if pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --schema-only \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --create \
        > "$backup_file" 2>/dev/null; then
        
        success "Sauvegarde des schémas créée: $backup_file"
    else
        error "Échec de la sauvegarde des schémas"
    fi
    
    # Compresser
    gzip "$backup_file"
    local size=$(du -h "$compressed_file" | cut -f1)
    log "Taille de la sauvegarde des schémas: $size"
}

# Nettoyage des anciennes sauvegardes
cleanup_old_backups() {
    log "Nettoyage des sauvegardes anciennes (>$RETENTION_DAYS jours)..."
    
    local deleted_count=0
    
    # Supprimer les sauvegardes complètes anciennes
    while IFS= read -r -d '' file; do
        rm "$file"
        deleted_count=$((deleted_count + 1))
    done < <(find "$BACKUP_DIR" -name "claimcompass_postgresql_*.sql.gz" -mtime +$RETENTION_DAYS -print0)
    
    # Supprimer les sauvegardes de données anciennes
    while IFS= read -r -d '' file; do
        rm "$file"
        deleted_count=$((deleted_count + 1))
    done < <(find "$BACKUP_DIR" -name "claimcompass_postgresql_*_data.sql.gz" -mtime +$RETENTION_DAYS -print0)
    
    # Supprimer les sauvegardes de schémas anciennes
    while IFS= read -r -d '' file; do
        rm "$file"
        deleted_count=$((deleted_count + 1))
    done < <(find "$BACKUP_DIR" -name "claimcompass_postgresql_*_schema.sql.gz" -mtime +$RETENTION_DAYS -print0)
    
    if [ $deleted_count -gt 0 ]; then
        log "$deleted_count ancienne(s) sauvegarde(s) supprimée(s)"
    else
        log "Aucune ancienne sauvegarde à supprimer"
    fi
}

# Vérification de l'intégrité de la sauvegarde
verify_backup() {
    log "Vérification de l'intégrité de la sauvegarde..."
    
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"
    
    if [ -f "$backup_file" ]; then
        # Vérifier que le fichier n'est pas corrompu
        if gzip -t "$backup_file" 2>/dev/null; then
            success "Sauvegarde vérifiée ✓"
        else
            error "Sauvegarde corrompue"
        fi
    else
        error "Fichier de sauvegarde introuvable"
    fi
}

# Statistiques de la base de données
show_database_stats() {
    log "Statistiques de la base de données..."
    
    psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    " 2>/dev/null || warn "Impossible d'obtenir les statistiques"
}

# Fonction principale
main() {
    log "=== Sauvegarde PostgreSQL ClaimCompass ==="
    log "Base de données: $DB_NAME"
    log "Rétention: $RETENTION_DAYS jours"
    
    check_prerequisites
    setup_backup_directory
    backup_database
    backup_data_only
    backup_schema_only
    cleanup_old_backups
    verify_backup
    show_database_stats
    
    log "=== Sauvegarde terminée avec succès ! ==="
    log "Répertoire: $BACKUP_DIR"
    log "Taille totale: $(du -sh "$BACKUP_DIR" | cut -f1)"
    
    # Afficher les fichiers créés
    echo ""
    echo "Fichiers créés:"
    ls -lh "$BACKUP_DIR"/*"$DATE"* 2>/dev/null || true
}

# Exécution
main "$@"
