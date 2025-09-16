#!/bin/bash

# Script d'installation et configuration PostgreSQL pour ClaimCompass
# Usage: ./setup-postgresql.sh [database_name] [username] [password]

set -e

# Configuration
DB_NAME=${1:-claimcompass}
DB_USER=${2:-claimcompass}
DB_PASSWORD=${3:-$(openssl rand -base64 32)}
APP_NAME="claimcompass"

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

# Installation de PostgreSQL
install_postgresql() {
    log "Installation de PostgreSQL..."
    
    # Mettre à jour les paquets
    apt update
    
    # Installer PostgreSQL et extensions
    apt install -y postgresql postgresql-contrib postgresql-client
    
    # Démarrer et activer PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    success "PostgreSQL installé ✓"
}

# Configuration de PostgreSQL
configure_postgresql() {
    log "Configuration de PostgreSQL..."
    
    # Configuration de l'authentification
    PG_VERSION=$(psql --version | grep -oP '\d+\.\d+' | head -1)
    PG_CONFIG="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
    PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
    
    # Optimiser la configuration
    cat >> "$PG_CONFIG" << EOF

# Configuration ClaimCompass
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 0
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
log_error_verbosity = default
EOF

    # Configuration de l'authentification
    cat >> "$PG_HBA" << EOF

# ClaimCompass configuration
local   $DB_NAME         $DB_USER                                 md5
host    $DB_NAME         $DB_USER         127.0.0.1/32            md5
host    $DB_NAME         $DB_USER         ::1/128                 md5
EOF

    # Redémarrer PostgreSQL
    systemctl restart postgresql
    
    success "PostgreSQL configuré ✓"
}

# Création de la base de données et utilisateur
create_database_and_user() {
    log "Création de la base de données et utilisateur..."
    
    # Se connecter en tant que postgres
    sudo -u postgres psql << EOF
-- Créer l'utilisateur
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Créer la base de données
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Accorder les privilèges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Se connecter à la base de données
\c $DB_NAME

-- Accorder les privilèges sur le schéma public
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Configuration par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Quitter
\q
EOF

    success "Base de données et utilisateur créés ✓"
}

# Configuration des extensions
setup_extensions() {
    log "Configuration des extensions PostgreSQL..."
    
    sudo -u postgres psql -d "$DB_NAME" << EOF
-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Quitter
\q
EOF

    success "Extensions configurées ✓"
}

# Configuration du monitoring
setup_monitoring() {
    log "Configuration du monitoring PostgreSQL..."
    
    # Créer un script de monitoring
    cat > "/usr/local/bin/postgresql-health-check.sh" << 'EOF'
#!/bin/bash
# Script de vérification de santé PostgreSQL

DB_NAME="claimcompass"
DB_USER="claimcompass"

# Vérifier la connexion
if psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "PostgreSQL: OK"
    exit 0
else
    echo "PostgreSQL: ERROR"
    exit 1
fi
EOF

    chmod +x "/usr/local/bin/postgresql-health-check.sh"
    
    # Ajouter à la surveillance PM2 (optionnel)
    if command -v pm2 &> /dev/null; then
        cat > "/var/www/$APP_NAME/postgresql-monitor.js" << EOF
const { exec } = require('child_process');

setInterval(() => {
    exec('/usr/local/bin/postgresql-health-check.sh', (error, stdout, stderr) => {
        if (error) {
            console.error('PostgreSQL Health Check Failed:', error);
        } else {
            console.log('PostgreSQL Health Check:', stdout.trim());
        }
    });
}, 60000); // Vérifier toutes les minutes
EOF
    fi
    
    success "Monitoring configuré ✓"
}

# Configuration des sauvegardes
setup_backups() {
    log "Configuration des sauvegardes PostgreSQL..."
    
    # Créer le répertoire de sauvegarde
    mkdir -p "/var/backups/postgresql"
    
    # Script de sauvegarde
    cat > "/usr/local/bin/backup-postgresql.sh" << EOF
#!/bin/bash
# Script de sauvegarde PostgreSQL

DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
BACKUP_DIR="/var/backups/postgresql"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\$BACKUP_DIR/\${DB_NAME}_backup_\$DATE.sql"

# Créer la sauvegarde
pg_dump -h localhost -U "\$DB_USER" -d "\$DB_NAME" > "\$BACKUP_FILE"

# Compresser
gzip "\$BACKUP_FILE"

# Nettoyer les anciennes sauvegardes (garder 7 jours)
find "\$BACKUP_DIR" -name "\${DB_NAME}_backup_*.sql.gz" -mtime +7 -delete

echo "Sauvegarde créée: \${BACKUP_FILE}.gz"
EOF

    chmod +x "/usr/local/bin/backup-postgresql.sh"
    
    # Ajouter à crontab (sauvegarde quotidienne à 2h du matin)
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-postgresql.sh") | crontab -
    
    success "Sauvegardes configurées ✓"
}

# Configuration de la sécurité
setup_security() {
    log "Configuration de la sécurité PostgreSQL..."
    
    # Restreindre l'accès réseau
    PG_VERSION=$(psql --version | grep -oP '\d+\.\d+' | head -1)
    PG_CONFIG="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
    
    # Modifier listen_addresses pour écouter seulement localhost
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" "$PG_CONFIG"
    
    # Redémarrer PostgreSQL
    systemctl restart postgresql
    
    success "Sécurité configurée ✓"
}

# Test de la configuration
test_configuration() {
    log "Test de la configuration..."
    
    # Tester la connexion
    if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        success "Connexion PostgreSQL réussie ✓"
    else
        error "Échec de la connexion PostgreSQL"
    fi
    
    # Afficher les informations de connexion
    echo ""
    echo "=========================================="
    echo "INFORMATIONS DE CONNEXION POSTGRESQL"
    echo "=========================================="
    echo "Host: localhost"
    echo "Port: 5432"
    echo "Database: $DB_NAME"
    echo "Username: $DB_USER"
    echo "Password: $DB_PASSWORD"
    echo ""
    echo "URL de connexion:"
    echo "postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
    echo ""
    echo "Commandes utiles:"
    echo "• Connexion: psql -h localhost -U $DB_USER -d $DB_NAME"
    echo "• Statut: systemctl status postgresql"
    echo "• Logs: journalctl -u postgresql -f"
    echo "• Sauvegarde: /usr/local/bin/backup-postgresql.sh"
    echo "=========================================="
}

# Fonction principale
main() {
    log "=== Installation PostgreSQL pour ClaimCompass ==="
    
    install_postgresql
    configure_postgresql
    create_database_and_user
    setup_extensions
    setup_monitoring
    setup_backups
    setup_security
    test_configuration
    
    success "=== Installation PostgreSQL terminée avec succès ! ==="
}

# Exécution
main "$@"
