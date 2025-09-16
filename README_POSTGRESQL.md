# 🐘 ClaimCompass - Déploiement VPS avec PostgreSQL

## 📁 Fichiers de déploiement PostgreSQL

### Scripts principaux
- `deploy-with-postgresql.sh` - **Déploiement complet avec PostgreSQL**
- `scripts/setup-postgresql.sh` - Installation et configuration PostgreSQL
- `scripts/backup-postgresql.sh` - Sauvegarde spécialisée PostgreSQL
- `scripts/backup.sh` - Sauvegarde générale de l'application
- `scripts/update.sh` - Mise à jour de l'application
- `scripts/health-check.sh` - Vérification de santé complète

### Configuration
- `env.example` - Template mis à jour pour PostgreSQL local
- `nginx-claimcompass.conf` - Configuration Nginx optimisée
- `ecosystem.config.js` - Configuration PM2

### Documentation
- `POSTGRESQL_DEPLOYMENT_GUIDE.md` - Guide complet PostgreSQL
- `DEPLOYMENT_GUIDE.md` - Guide général (Neon + PostgreSQL)

## 🚀 Déploiement rapide avec PostgreSQL

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

### 2. Sur le VPS - Déploiement automatique
```bash
# Extraction
cd /tmp
tar -xzf claimcompass-deploy.tar.gz
mv claimcompass-deploy /tmp/claimcompass-deploy

# Déploiement complet avec PostgreSQL
/tmp/claimcompass-deploy/deploy-with-postgresql.sh production yourdomain.com
```

## 🔧 Gestion quotidienne

### Commandes PostgreSQL
```bash
# Connexion à la base
psql -h localhost -U claimcompass -d claimcompass

# Statut PostgreSQL
systemctl status postgresql

# Logs PostgreSQL
journalctl -u postgresql -f

# Sauvegarde manuelle
/usr/local/bin/backup-postgresql.sh

# Vérification de santé
/var/www/claimcompass/scripts/health-check.sh
```

### Commandes application
```bash
# Statut de l'application
pm2 status

# Logs en temps réel
pm2 logs claimcompass

# Redémarrage
pm2 restart claimcompass

# Mise à jour
/var/www/claimcompass/scripts/update.sh
```

## 🎯 Avantages PostgreSQL local vs Neon

| Aspect | PostgreSQL Local | Neon Serverless |
|--------|------------------|-----------------|
| **Coût** | Gratuit | Payant (500MB+) |
| **Performance** | Excellente (local) | Bonne (réseau) |
| **Contrôle** | Total | Limité |
| **Sécurité** | Données locales | Données cloud |
| **Backup** | Sauvegardes complètes | Limité |
| **Monitoring** | Accès direct | Interface web |
| **Configuration** | Personnalisable | Prédéfinie |

## 💰 Coût total estimé

- **VPS** : 10-25€/mois (4-8 GB RAM)
- **PostgreSQL** : Gratuit
- **SendGrid** : Gratuit (100 emails/jour)
- **Stripe** : 2.9% + 0.30€ par transaction
- **Total** : ~15-30€/mois

**Économie** : 95% moins cher qu'AWS (800€/mois)

## 🛠️ Architecture finale

```
VPS Ubuntu/Debian
├── PostgreSQL 14+ (Base de données)
├── Node.js + Express (Backend)
├── React build (Frontend statique)
├── Nginx (Reverse proxy + SSL)
├── PM2 (Gestion des processus)
└── Scripts de sauvegarde automatique
```

## 📊 Monitoring et maintenance

### Sauvegardes automatiques
- **Application** : Quotidienne à 2h du matin
- **PostgreSQL** : Quotidienne à 3h du matin
- **Rétention** : 30 jours par défaut

### Surveillance
- **Health check** : Script automatique
- **Logs** : PM2 + PostgreSQL + Nginx
- **Métriques** : Accès direct à PostgreSQL

## 🔒 Sécurité

### PostgreSQL
- Accès restreint à localhost uniquement
- Authentification par mot de passe
- Sauvegardes chiffrées (optionnel)

### Application
- HTTPS avec Let's Encrypt
- Firewall configuré
- Headers de sécurité Nginx

## 🚨 Dépannage

### Problèmes courants
1. **PostgreSQL ne démarre pas** → Vérifier les logs : `journalctl -u postgresql`
2. **Application ne se connecte pas** → Vérifier `DATABASE_URL` dans `.env`
3. **Erreurs de permissions** → Vérifier les propriétaires des fichiers
4. **Problèmes de performance** → Optimiser la configuration PostgreSQL

### Commandes de diagnostic
```bash
# Vérification complète
/var/www/claimcompass/scripts/health-check.sh

# Logs en temps réel
pm2 logs claimcompass --lines 50
journalctl -u postgresql -f

# Test de connexion base
psql -h localhost -U claimcompass -d claimcompass -c "SELECT 1;"
```

## ✅ Checklist de déploiement

- [ ] VPS configuré (Ubuntu 20.04+)
- [ ] PostgreSQL installé et configuré
- [ ] Application déployée et fonctionnelle
- [ ] Nginx configuré avec SSL
- [ ] PM2 configuré pour redémarrage automatique
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring en place
- [ ] Tests de fonctionnement effectués

## 🎉 Félicitations !

Votre application ClaimCompass est maintenant déployée avec :
- ✅ PostgreSQL local optimisé
- ✅ HTTPS avec certificat SSL automatique
- ✅ Reverse proxy Nginx optimisé
- ✅ Gestion des processus avec PM2
- ✅ Sauvegardes automatiques
- ✅ Monitoring et logs
- ✅ Coût optimisé (15-30€/mois)

**Votre plateforme de réclamation d'indemnisation est prête ! 🚀**

---

## 📞 Support

En cas de problème :
1. Consultez `POSTGRESQL_DEPLOYMENT_GUIDE.md`
2. Exécutez `scripts/health-check.sh`
3. Vérifiez les logs : `pm2 logs claimcompass`

**Bonne chance avec votre déploiement PostgreSQL ! 🐘**
