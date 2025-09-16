# 🚀 ClaimCompass - Déploiement VPS

## 📁 Fichiers de déploiement créés

### Scripts principaux
- `deploy.sh` - Script de déploiement principal
- `setup-ssl.sh` - Configuration SSL avec Let's Encrypt
- `ecosystem.config.js` - Configuration PM2

### Scripts utilitaires
- `scripts/backup.sh` - Sauvegarde automatique
- `scripts/update.sh` - Mise à jour de l'application
- `scripts/health-check.sh` - Vérification de santé

### Configuration
- `env.example` - Template des variables d'environnement
- `nginx-claimcompass.conf` - Configuration Nginx avancée

### Documentation
- `DEPLOYMENT_GUIDE.md` - Guide complet de déploiement

## 🚀 Déploiement rapide

### 1. Préparation
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

### 2. Sur le VPS
```bash
# Extraction
cd /tmp
tar -xzf claimcompass-deploy.tar.gz
mv claimcompass-deploy /tmp/claimcompass-deploy

# Configuration
cp /tmp/claimcompass-deploy/env.example /tmp/claimcompass-deploy/.env
nano /tmp/claimcompass-deploy/.env

# Déploiement
/tmp/claimcompass-deploy/deploy.sh production

# SSL (optionnel)
/var/www/claimcompass/setup-ssl.sh yourdomain.com admin@yourdomain.com
```

## 🔧 Gestion quotidienne

### Commandes utiles
```bash
# Statut de l'application
pm2 status

# Logs en temps réel
pm2 logs claimcompass

# Redémarrage
pm2 restart claimcompass

# Vérification de santé
/var/www/claimcompass/scripts/health-check.sh

# Mise à jour
/var/www/claimcompass/scripts/update.sh

# Sauvegarde
/var/www/claimcompass/scripts/backup.sh
```

## 💰 Coût estimé

- **VPS** : 5-15€/mois
- **Neon Database** : Gratuit (500MB)
- **SendGrid** : Gratuit (100 emails/jour)
- **Stripe** : 2.9% + 0.30€ par transaction
- **Total** : ~10-20€/mois (vs 800€/mois AWS)

## 🎯 Avantages VPS vs Cloud

✅ **Simplicité** - Un seul serveur à gérer  
✅ **Coût** - 10-20x moins cher  
✅ **Contrôle** - Configuration personnalisée  
✅ **Performance** - Pas de cold start  
✅ **Flexibilité** - Installation de logiciels libres  

## 📞 Support

En cas de problème :
1. Consultez `DEPLOYMENT_GUIDE.md`
2. Exécutez `scripts/health-check.sh`
3. Vérifiez les logs : `pm2 logs claimcompass`

---

**Votre application ClaimCompass est prête pour le déploiement ! 🎉**
