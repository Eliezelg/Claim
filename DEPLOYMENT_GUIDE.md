# 🚀 Guide de Déploiement ClaimCompass sur VPS

Ce guide vous accompagne pour déployer ClaimCompass sur un VPS Ubuntu/Debian avec Nginx, PM2 et SSL.

## 📋 Prérequis

### VPS requis
- **OS** : Ubuntu 20.04+ ou Debian 11+
- **RAM** : 2-4 GB (minimum 2 GB)
- **CPU** : 2-4 vCPU
- **Stockage** : 20-50 GB SSD
- **Bande passante** : Illimitée
- **Prix estimé** : 5-15€/mois

### Services externes
- **Neon Database** : PostgreSQL serverless (gratuit jusqu'à 500MB)
- **SendGrid** : Service email (gratuit jusqu'à 100 emails/jour)
- **Stripe** : Paiements (pas de coût fixe)
- **Nom de domaine** : Votre domaine personnalisé

## 🛠️ Installation Initiale

### 1. Connexion au VPS
```bash
ssh root@your-vps-ip
```

### 2. Mise à jour du système
```bash
apt update && apt upgrade -y
```

### 3. Installation des dépendances
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Nginx
apt install -y nginx

# PM2
npm install -g pm2

# Outils utiles
apt install -y curl wget git unzip
```

### 4. Configuration du firewall
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

## 📦 Déploiement de l'Application

### 1. Préparation des fichiers
```bash
# Sur votre machine locale
tar -czf claimcompass-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=uploads \
  --exclude=dist \
  .

# Upload vers le VPS
scp claimcompass-deploy.tar.gz root@your-vps-ip:/tmp/
```

### 2. Extraction sur le VPS
```bash
# Sur le VPS
cd /tmp
tar -xzf claimcompass-deploy.tar.gz
mv claimcompass-deploy /tmp/claimcompass-deploy
```

### 3. Configuration des variables d'environnement
```bash
# Copier le template
cp /tmp/claimcompass-deploy/env.example /tmp/claimcompass-deploy/.env

# Éditer la configuration
nano /tmp/claimcompass-deploy/.env
```

**Variables importantes à configurer :**
```bash
# Base de données Neon
DATABASE_URL=postgresql://username:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Secrets (générez des clés fortes)
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

### 4. Exécution du script de déploiement
```bash
# Rendre le script exécutable
chmod +x /tmp/claimcompass-deploy/deploy.sh

# Exécuter le déploiement
/tmp/claimcompass-deploy/deploy.sh production
```

## 🔒 Configuration SSL

### 1. Configuration du domaine
```bash
# Mettre à jour la configuration Nginx avec votre domaine
sed -i 's/yourdomain.com/yourdomain.com/g' /etc/nginx/sites-available/claimcompass
```

### 2. Installation de SSL
```bash
# Rendre le script SSL exécutable
chmod +x /var/www/claimcompass/setup-ssl.sh

# Configurer SSL
/var/www/claimcompass/setup-ssl.sh yourdomain.com admin@yourdomain.com
```

## 🗄️ Configuration de la Base de Données

### Option 1 : Neon Database (Recommandé)
1. Créez un compte sur [Neon](https://neon.tech)
2. Créez une nouvelle base de données
3. Copiez l'URL de connexion dans `DATABASE_URL`
4. Exécutez les migrations :
```bash
cd /var/www/claimcompass
npm run db:push
```

### Option 2 : PostgreSQL local
```bash
# Installation PostgreSQL
apt install -y postgresql postgresql-contrib

# Création de la base
sudo -u postgres createdb claimcompass
sudo -u postgres createuser claimcompass
sudo -u postgres psql -c "ALTER USER claimcompass PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE claimcompass TO claimcompass;"

# Mise à jour de DATABASE_URL
DATABASE_URL=postgresql://claimcompass:your-password@localhost:5432/claimcompass
```

## 📧 Configuration Email (SendGrid)

1. Créez un compte sur [SendGrid](https://sendgrid.com)
2. Générez une API Key
3. Ajoutez-la dans `.env` :
```bash
SENDGRID_API_KEY=SG.your-api-key-here
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=ClaimCompass
```

## 💳 Configuration Paiements (Stripe)

1. Créez un compte sur [Stripe](https://stripe.com)
2. Récupérez vos clés API
3. Ajoutez-les dans `.env` :
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
STRIPE_SECRET_KEY=sk_live_your-secret-key
```

## 🔧 Gestion de l'Application

### Commandes PM2 utiles
```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs claimcompass

# Redémarrer l'application
pm2 restart claimcompass

# Arrêter l'application
pm2 stop claimcompass

# Démarrer l'application
pm2 start claimcompass

# Monitoring en temps réel
pm2 monit
```

### Commandes Nginx utiles
```bash
# Tester la configuration
nginx -t

# Recharger la configuration
systemctl reload nginx

# Redémarrer Nginx
systemctl restart nginx

# Voir les logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🔄 Mise à Jour de l'Application

### Script de mise à jour
```bash
#!/bin/bash
# update-app.sh

cd /var/www/claimcompass

# Sauvegarde
pm2 stop claimcompass
tar -czf backup-$(date +%Y%m%d_%H%M%S).tar.gz .

# Mise à jour
git pull origin main
npm ci --only=production
npm run build

# Redémarrage
pm2 start claimcompass
```

## 📊 Monitoring et Logs

### Logs de l'application
```bash
# Logs PM2
pm2 logs claimcompass --lines 100

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs système
journalctl -u nginx -f
```

### Monitoring des ressources
```bash
# Utilisation CPU/Mémoire
htop

# Espace disque
df -h

# Processus Node.js
ps aux | grep node
```

## 🛡️ Sécurité

### Configuration firewall avancée
```bash
# Bloquer les ports inutiles
ufw deny 3000  # Port de l'application (accessible via Nginx)
ufw deny 5432  # PostgreSQL (si local)

# Limiter les connexions SSH
ufw limit ssh
```

### Mise à jour automatique
```bash
# Configuration des mises à jour automatiques
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## 🚨 Dépannage

### Problèmes courants

#### 1. Application ne démarre pas
```bash
# Vérifier les logs
pm2 logs claimcompass

# Vérifier la configuration
node -c dist/index.js

# Vérifier les variables d'environnement
pm2 env claimcompass
```

#### 2. Erreurs de base de données
```bash
# Tester la connexion
node -e "console.log(process.env.DATABASE_URL)"

# Vérifier les migrations
npm run db:push
```

#### 3. Problèmes SSL
```bash
# Vérifier le certificat
certbot certificates

# Renouveler le certificat
certbot renew --dry-run
```

#### 4. Erreurs Nginx
```bash
# Tester la configuration
nginx -t

# Vérifier les permissions
ls -la /var/www/claimcompass/
```

## 📈 Optimisation

### Performance
```bash
# Augmenter les limites de fichiers
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimiser Nginx
# Ajouter dans /etc/nginx/nginx.conf :
worker_processes auto;
worker_connections 1024;
```

### Sauvegarde automatique
```bash
# Script de sauvegarde quotidienne
cat > /usr/local/bin/backup-claimcompass.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/claimcompass"
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C /var/www claimcompass
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-claimcompass.sh

# Ajouter à crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-claimcompass.sh") | crontab -
```

## ✅ Vérification du Déploiement

### Tests à effectuer
1. **Site accessible** : `https://yourdomain.com`
2. **API fonctionnelle** : `https://yourdomain.com/api/health`
3. **SSL valide** : Vérifier avec [SSL Labs](https://www.ssllabs.com/ssltest/)
4. **Upload de fichiers** : Tester l'upload de documents
5. **Email** : Tester l'envoi d'emails
6. **Paiements** : Tester le processus de paiement

### Commandes de vérification
```bash
# Vérifier que l'application répond
curl -I https://yourdomain.com

# Vérifier l'API
curl https://yourdomain.com/api/health

# Vérifier les processus
pm2 status
systemctl status nginx
```

## 🎉 Félicitations !

Votre application ClaimCompass est maintenant déployée sur votre VPS avec :
- ✅ HTTPS avec certificat SSL automatique
- ✅ Reverse proxy Nginx optimisé
- ✅ Gestion des processus avec PM2
- ✅ Base de données PostgreSQL
- ✅ Service email SendGrid
- ✅ Paiements Stripe
- ✅ Monitoring et logs
- ✅ Sauvegardes automatiques

**Coût total estimé** : 10-20€/mois (vs 800€/mois avec AWS)

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `pm2 logs claimcompass`
2. Consultez ce guide de dépannage
3. Vérifiez la configuration des services externes

**Bonne chance avec votre déploiement ! 🚀**
