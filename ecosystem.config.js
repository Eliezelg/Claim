module.exports = {
  apps: [
    {
      name: 'claimcompass',
      script: './dist/index.js',
      cwd: '/var/www/claimcompass',
      instances: 1, // Commencer avec 1 instance, peut être augmenté selon les besoins
      exec_mode: 'fork', // 'cluster' pour plusieurs instances
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      // Configuration de redémarrage automatique
      autorestart: true,
      watch: false, // Désactivé en production
      max_memory_restart: '1G',
      
      // Logs
      log_file: '/var/log/claimcompass/combined.log',
      out_file: '/var/log/claimcompass/out.log',
      error_file: '/var/log/claimcompass/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Gestion des erreurs
      min_uptime: '10s',
      max_restarts: 10,
      
      // Variables d'environnement spécifiques
      env_file: '.env',
      
      // Configuration avancée
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Monitoring
      pmx: true,
      
      // Configuration pour les uploads
      node_args: '--max-old-space-size=1024'
    }
  ],

  // Configuration de déploiement (optionnel)
  deploy: {
    production: {
      user: 'root',
      host: 'your-vps-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/claimcompass.git',
      path: '/var/www/claimcompass',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'root',
      host: 'your-staging-vps-ip',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/claimcompass.git',
      path: '/var/www/claimcompass-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};
