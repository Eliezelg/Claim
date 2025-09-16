#!/bin/bash

# Script de vérification de santé pour ClaimCompass
# Usage: ./health-check.sh

set -e

# Configuration
APP_NAME="claimcompass"
APP_URL="http://localhost:3000"
NGINX_URL="http://localhost"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Compteurs
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Fonctions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "Vérification: $1... "
}

# Vérification des processus
check_processes() {
    check "Processus PM2"
    if pm2 list | grep -q "$APP_NAME.*online"; then
        success "PM2 - Application en cours d'exécution"
    else
        error "PM2 - Application non démarrée"
    fi
    
    check "Processus Nginx"
    if systemctl is-active --quiet nginx; then
        success "Nginx - Service actif"
    else
        error "Nginx - Service inactif"
    fi
}

# Vérification des ports
check_ports() {
    check "Port 3000 (Application)"
    if netstat -tlnp | grep -q ":3000"; then
        success "Port 3000 - Écoute"
    else
        error "Port 3000 - Non accessible"
    fi
    
    check "Port 80 (HTTP)"
    if netstat -tlnp | grep -q ":80"; then
        success "Port 80 - Écoute"
    else
        error "Port 80 - Non accessible"
    fi
    
    check "Port 443 (HTTPS)"
    if netstat -tlnp | grep -q ":443"; then
        success "Port 443 - Écoute"
    else
        warn "Port 443 - Non accessible (SSL non configuré ?)"
    fi
}

# Vérification de l'application
check_application() {
    check "Réponse de l'application"
    if curl -s -o /dev/null -w "%{http_code}" "$APP_URL/health" | grep -q "200"; then
        success "Application - Répond correctement"
    else
        error "Application - Ne répond pas"
    fi
    
    check "API Health Check"
    if curl -s "$APP_URL/api/health" | grep -q "healthy"; then
        success "API - Health check OK"
    else
        error "API - Health check échoué"
    fi
}

# Vérification de Nginx
check_nginx() {
    check "Configuration Nginx"
    if nginx -t 2>/dev/null; then
        success "Nginx - Configuration valide"
    else
        error "Nginx - Configuration invalide"
    fi
    
    check "Réponse Nginx"
    if curl -s -o /dev/null -w "%{http_code}" "$NGINX_URL" | grep -q "200\|301\|302"; then
        success "Nginx - Répond correctement"
    else
        error "Nginx - Ne répond pas"
    fi
}

# Vérification des ressources
check_resources() {
    check "Utilisation mémoire"
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$MEMORY_USAGE < 80" | bc -l) )); then
        success "Mémoire - ${MEMORY_USAGE}% utilisée"
    else
        warn "Mémoire - ${MEMORY_USAGE}% utilisée (élevé)"
    fi
    
    check "Utilisation CPU"
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$CPU_USAGE < 80" | bc -l) )); then
        success "CPU - ${CPU_USAGE}% utilisée"
    else
        warn "CPU - ${CPU_USAGE}% utilisée (élevé)"
    fi
    
    check "Espace disque"
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    if [ "$DISK_USAGE" -lt 80 ]; then
        success "Disque - ${DISK_USAGE}% utilisé"
    else
        warn "Disque - ${DISK_USAGE}% utilisé (élevé)"
    fi
}

# Vérification des logs
check_logs() {
    check "Logs d'erreur récents"
    ERROR_COUNT=$(pm2 logs "$APP_NAME" --lines 50 --err 2>/dev/null | grep -i error | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        success "Logs - Aucune erreur récente"
    else
        warn "Logs - $ERROR_COUNT erreurs récentes"
    fi
}

# Vérification de la base de données
check_database() {
    check "Connexion base de données"
    if [ -n "$DATABASE_URL" ]; then
        if node -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT 1').then(() => { console.log('OK'); process.exit(0); }).catch(() => { console.log('ERROR'); process.exit(1); });" 2>/dev/null | grep -q "OK"; then
            success "Base de données - Connexion OK"
        else
            error "Base de données - Connexion échouée"
        fi
    else
        warn "Base de données - URL non configurée"
    fi
}

# Vérification SSL (si configuré)
check_ssl() {
    if [ -f "/etc/letsencrypt/live/*/fullchain.pem" ]; then
        check "Certificat SSL"
        if openssl x509 -in /etc/letsencrypt/live/*/fullchain.pem -text -noout | grep -q "Not After"; then
            success "SSL - Certificat valide"
        else
            error "SSL - Certificat invalide"
        fi
    else
        warn "SSL - Certificat non trouvé"
    fi
}

# Rapport final
generate_report() {
    echo ""
    echo "=========================================="
    echo "RAPPORT DE SANTÉ CLAIMCOMPASS"
    echo "=========================================="
    echo "Total des vérifications: $TOTAL_CHECKS"
    echo "Réussies: $PASSED_CHECKS"
    echo "Échouées: $FAILED_CHECKS"
    echo "Avertissements: $((TOTAL_CHECKS - PASSED_CHECKS - FAILED_CHECKS))"
    echo ""
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        success "🎉 Toutes les vérifications sont passées !"
        exit 0
    else
        error "❌ $FAILED_CHECKS vérification(s) ont échoué"
        exit 1
    fi
}

# Fonction principale
main() {
    log "=== Vérification de santé ClaimCompass ==="
    
    check_processes
    check_ports
    check_application
    check_nginx
    check_resources
    check_logs
    check_database
    check_ssl
    
    generate_report
}

# Exécution
main "$@"
