# 🐘 Guide de Déploiement ClaimCompass avec PostgreSQL sur VPS

Ce guide vous accompagne pour déployer ClaimCompass sur un VPS avec PostgreSQL local au lieu de Neon.

## 🎯 Avantages PostgreSQL local

✅ **Contrôle total** - Base de données sur votre VPS  
✅ **Performance** - Pas de latence réseau  
✅ **Coût** - Gratuit (vs Neon payant)  
✅ **Sécurité** - Données restent sur votre serveur  
✅ **Backup** - Sauvegardes locales complètes  

## 📋 Prérequis

### VPS requis
- **OS** : Ubuntu 20.04+ ou Debian 11+
- **RAM** : 4-8 GB (PostgreSQL + Application)
- **CPU** : 2-4 vCPU
- **Stockage** : 50-100 GB SSD (base de données + uploads)
- **Bande passante** : Illimitée
- **Prix estimé** : 10-25€/mois

## 🚀 Déploiement automatique

### 1. Préparation des fichiers
```bash
# Sur votre machine locale
tar -czf claimcompass-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=uploads \
  --exclude=dist \
  .

scp claimcompass-deploy.tar.gz root@your-vps-ip:/tmp/
```

### 2. Sur le VPS - Déploiement complet
```bash
# Extraction
cd /tmp
tar -xzf claimcompass-deploy.tar.gz
mv claimcompass-deploy /tmp/claimcompass-deploy

# Déploiement automatique avec PostgreSQL
chmod +x /tmp/claimcompass-deploy/deploy-with-postgresql.sh
/tmp/claimcompass-deploy/deploy-with-postgresql.sh production yourdomain.com
```

## 🛠️ Déploiement manuel étape par étape

### 1. Installation des prérequis
```bash
# Mise à jour du système
apt update && apt upgrade -y

# Installation des dépendances
apt install -y curl wget git unzip software-properties-common

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Nginx
apt install -y nginx

# PM2
npm install -g pm2
```

### 2. Installation et configuration PostgreSQL
```bash
# Installation PostgreSQL
apt install -y postgresql postgresql-contrib

# Démarrer PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Configuration automatique
chmod +x /tmp/claimcompass-deploy/scripts/setup-postgresql.sh
/tmp/claimcompass-deploy/scripts/setup-postgresql.sh claimcompass claimcompass
```

### 3. Configuration de l'application
```bash
# Créer les répertoires
mkdir -p /var/www/claimcompass
mkdir -p /var/log/claimcompass
mkdir -p /var/backups/claimcompass
mkdir -p /var/backups/postgresql

# Copier l'application
cp -r /tmp/claimcompass-deploy/* /var/www/claimcompass/
cd /var/www/claimcompass

# Configuration des variables d'environnement
cp env.example .env
nano .env
```

**Variables importantes à configurer :**
```bash
# Base de données PostgreSQL locale
DATABASE_URL=postgresql://claimcompass:your-password@localhost:5432/claimcompass

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# SendGrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
FROM_EMAIL=noreply@yourdomain.com

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key

# Domaine
DOMAIN=yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### 4. Installation et build
```bash
# Dépendances
npm ci --only=production

# Build
npm run build

# Migrations de base de données
npm run db:push
```

### 5. Configuration Nginx
```bash
# Configuration Nginx
cp nginx-claimcompass.conf /etc/nginx/sites-available/claimcompass

# Remplacer yourdomain.com par votre domaine
sed -i 's/yourdomain.com/yourdomain.com/g' /etc/nginx/sites-available/claimcompass

# Activer le site
ln -s /etc/nginx/sites-available/claimcompass /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester et recharger
nginx -t
systemctl reload nginx
```

### 6. Démarrage de l'application
```bash
# Démarrer avec PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 🔧 Gestion de PostgreSQL

### Commandes utiles
```bash
# Connexion à la base de données
psql -h localhost -U claimcompass -d claimcompass

# Statut de PostgreSQL
systemctl status postgresql

# Redémarrer PostgreSQL
systemctl restart postgresql

# Logs PostgreSQL
journalctl -u postgresql -f

# Vérifier les connexions
psql -h localhost -U claimcompass -d claimcompass -c "SELECT * FROM pg_stat_activity;"
```

### Optimisation PostgreSQL
```bash
# Configuration optimisée pour VPS
nano /etc/postgresql/*/main/postgresql.conf

# Ajouter ces paramètres :
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
```

## 💾 Sauvegardes PostgreSQL

### Sauvegarde manuelle
```bash
# Sauvegarde complète
pg_dump -h localhost -U claimcompass -d claimcompass > backup_$(date +%Y%m%d_%H%M%S).sql

# Sauvegarde compressée
pg_dump -h localhost -U claimcompass -d claimcompass | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restauration
psql -h localhost -U claimcompass -d claimcompass < backup_file.sql
```

### Sauvegardes automatiques
```bash
# Script de sauvegarde automatique
chmod +x /var/www/claimcompass/scripts/backup-postgresql.sh

# Sauvegarde quotidienne à 2h du matin
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/claimcompass/scripts/backup-postgresql.sh") | crontab -
```

## 📊 Monitoring PostgreSQL

### Vérification de santé
```bash
# Script de vérification
chmod +x /var/www/claimcompass/scripts/health-check.sh
/var/www/claimcompass/scripts/health-check.sh
```

### Statistiques de performance
```sql
-- Taille de la base de données
SELECT pg_size_pretty(pg_database_size('claimcompass'));

-- Tables les plus volumineuses
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Connexions actives
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
```

## 🔒 Sécurité PostgreSQL

### Configuration de sécurité
```bash
# Restreindre l'accès réseau
nano /etc/postgresql/*/main/postgresql.conf
# Modifier : listen_addresses = 'localhost'

# Configuration de l'authentification
nano /etc/postgresql/*/main/pg_hba.conf
# Ajouter :
# local   claimcompass         claimcompass                                 md5
# host    claimcompass         claimcompass         127.0.0.1/32            md5

# Redémarrer PostgreSQL
systemctl restart postgresql
```

### Chiffrement des sauvegardes
```bash
# Sauvegarde chiffrée
pg_dump -h localhost -U claimcompass -d claimcompass | gzip | openssl enc -aes-256-cbc -salt -out backup_$(date +%Y%m%d_%H%M%S).sql.gz.enc

# Restauration depuis sauvegarde chiffrée
openssl enc -aes-256-cbc -d -in backup_file.sql.gz.enc | gunzip | psql -h localhost -U claimcompass -d claimcompass
```

## 🚨 Dépannage PostgreSQL

### Problèmes courants

#### 1. PostgreSQL ne démarre pas
```bash
# Vérifier les logs
journalctl -u postgresql -f

# Vérifier la configuration
postgresql -t

# Réparer la base de données
sudo -u postgres pg_resetwal /var/lib/postgresql/*/main/
```

#### 2. Erreurs de connexion
```bash
# Vérifier que PostgreSQL écoute
netstat -tlnp | grep 5432

# Tester la connexion
psql -h localhost -U claimcompass -d claimcompass -c "SELECT 1;"

# Vérifier les permissions
sudo -u postgres psql -c "\du"
```

#### 3. Problèmes de performance
```bash
# Vérifier les requêtes lentes
sudo -u postgres psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Analyser les index
sudo -u postgres psql -d claimcompass -c "SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE schemaname = 'public';"
```

## 📈 Optimisation des performances

### Configuration VPS optimisée
```bash
# Augmenter les limites de fichiers
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimiser le kernel
echo "vm.swappiness = 10" >> /etc/sysctl.conf
echo "vm.dirty_ratio = 15" >> /etc/sysctl.conf
echo "vm.dirty_background_ratio = 5" >> /etc/sysctl.conf
sysctl -p
```

### Monitoring avancé
```bash
# Installation de pg_stat_statements
sudo -u postgres psql -d claimcompass -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Installation de pg_top (optionnel)
apt install -y pg_top
```

## ✅ Vérification du déploiement

### Tests à effectuer
1. **Application** : `http://your-vps-ip` ou `https://yourdomain.com`
2. **API** : `curl http://your-vps-ip/api/health`
3. **PostgreSQL** : `psql -h localhost -U claimcompass -d claimcompass -c "SELECT version();"`
4. **Uploads** : Tester l'upload de documents
5. **Base de données** : Vérifier que les données sont sauvegardées

### Commandes de vérification
```bash
# Vérifier tous les services
systemctl status postgresql nginx
pm2 status

# Vérifier les logs
pm2 logs claimcompass
journalctl -u postgresql -f

# Test de performance
/var/www/claimcompass/scripts/health-check.sh
```

## 💰 Coût total estimé

- **VPS** : 10-25€/mois
- **PostgreSQL** : Gratuit
- **SendGrid** : Gratuit (100 emails/jour)
- **Stripe** : 2.9% + 0.30€ par transaction
- **Total** : ~15-30€/mois (vs 800€/mois AWS)

## 🎉 Avantages du déploiement PostgreSQL

✅ **Performance** - Base de données locale, pas de latence  
✅ **Contrôle** - Configuration personnalisée  
✅ **Sécurité** - Données restent sur votre serveur  
✅ **Coût** - Gratuit vs Neon payant  
✅ **Backup** - Sauvegardes complètes locales  
✅ **Monitoring** - Accès direct aux logs et métriques  

---

**Votre application ClaimCompass avec PostgreSQL est prête ! 🐘🚀**
