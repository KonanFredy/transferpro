# TransferPro - Guide d'Installation et Configuration

## Table des Matieres

1. [Prerequis](#prerequis)
2. [Installation Locale](#installation-locale)
3. [Configuration](#configuration)
4. [Deploiement en Production](#deploiement-en-production)
5. [Maintenance](#maintenance)

---

## Prerequis

### Pour le Frontend (Next.js)
- Node.js 18.x ou superieur
- npm 9.x ou yarn 1.22.x
- Git

### Pour le Backend (Django)
- Python 3.10 ou superieur
- pip (gestionnaire de paquets Python)
- PostgreSQL 14+ (recommande) ou SQLite (developpement)
- Redis (optionnel, pour le cache et les sessions)

---

## Installation Locale

### 1. Cloner le Projet

```bash
git clone https://github.com/votre-repo/transferpro.git
cd transferpro
```

### 2. Configuration du Backend Django

#### 2.1 Creer un environnement virtuel

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

#### 2.2 Installer les dependances

```bash
pip install -r requirements.txt
```

#### 2.3 Fichier requirements.txt

Creer le fichier `backend/requirements.txt` avec le contenu suivant :

```txt
Django>=4.2,<5.0
djangorestframework>=3.14.0
djangorestframework-simplejwt>=5.3.0
django-cors-headers>=4.3.0
django-filter>=23.5
psycopg2-binary>=2.9.9
python-dotenv>=1.0.0
gunicorn>=21.2.0
whitenoise>=6.6.0
Pillow>=10.1.0
```

#### 2.4 Configurer les variables d'environnement

Creer le fichier `backend/.env` :

```env
# Mode Debug (False en production)
DEBUG=True

# Cle secrete Django (generer une nouvelle pour la production)
SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire

# Base de donnees
DATABASE_URL=postgres://user:password@localhost:5432/transferpro
# Ou pour SQLite (developpement uniquement)
# DATABASE_URL=sqlite:///db.sqlite3

# Hosts autorises (separes par des virgules)
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS - Origines autorisees
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Configuration JWT
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=1440  # minutes (24h)

# Email (optionnel)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-app

# API Taux de change (optionnel)
EXCHANGE_RATE_API_KEY=votre-cle-api
```

#### 2.5 Configurer la base de donnees

Modifier `backend/transferpro/settings.py` pour utiliser les variables d'environnement :

```python
import os
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

# Database
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///db.sqlite3')
DATABASES = {
    'default': dj_database_url.parse(DATABASE_URL)
}
```

#### 2.6 Appliquer les migrations

```bash
python manage.py migrate
```

#### 2.7 Creer un superutilisateur

```bash
python manage.py createsuperuser
```

Suivre les instructions pour creer le compte administrateur.

#### 2.8 Charger les donnees initiales (optionnel)

```bash
python manage.py loaddata initial_data.json
```

#### 2.9 Lancer le serveur de developpement

```bash
python manage.py runserver
```

Le backend sera accessible sur `http://localhost:8000`

---

### 3. Configuration du Frontend Next.js

#### 3.1 Installer les dependances

```bash
# Depuis la racine du projet
npm install
# ou
yarn install
```

#### 3.2 Configurer les variables d'environnement

Creer le fichier `.env.local` a la racine :

```env
# URL de l'API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# URL de base de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cle API pour les taux de change en temps reel (optionnel)
NEXT_PUBLIC_EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest
```

#### 3.3 Lancer le serveur de developpement

```bash
npm run dev
# ou
yarn dev
```

Le frontend sera accessible sur `http://localhost:3000`

---

## Configuration

### Structure des Dossiers

```
transferpro/
├── app/                    # Pages Next.js (App Router)
├── components/             # Composants React
├── lib/                    # Utilitaires et API
├── public/                 # Fichiers statiques
├── backend/
│   ├── apps/
│   │   ├── clients/       # App clients
│   │   ├── dashboard/     # App tableau de bord
│   │   ├── notifications/ # App notifications
│   │   ├── parametres/    # App parametres (devises, pays, taux, frais)
│   │   ├── transactions/  # App transactions
│   │   └── users/         # App utilisateurs/auth
│   ├── transferpro/       # Configuration Django
│   └── manage.py
└── package.json
```

### Endpoints API Principaux

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login/` | Connexion |
| POST | `/api/auth/logout/` | Deconnexion |
| GET | `/api/auth/me/` | Profil utilisateur |
| POST | `/api/auth/forgot-password/` | Mot de passe oublie |
| GET | `/api/clients/` | Liste des clients |
| POST | `/api/clients/` | Creer un client |
| GET | `/api/transactions/` | Liste des transactions |
| POST | `/api/transactions/` | Creer une transaction |
| GET | `/api/dashboard/statistics/` | Statistiques dashboard |
| GET | `/api/devises/` | Liste des devises |
| GET | `/api/pays/` | Liste des pays |
| GET | `/api/taux/` | Liste des taux de change |
| GET | `/api/notifications/` | Liste des notifications |

---

## Deploiement en Production

### Option 1: Deploiement sur Vercel (Frontend) + Railway/Render (Backend)

#### Frontend sur Vercel

1. **Connecter le repository GitHub a Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "New Project"
   - Importer le repository GitHub

2. **Configurer les variables d'environnement**
   - Dans les parametres du projet Vercel
   - Ajouter les variables :
   ```
   NEXT_PUBLIC_API_URL=https://votre-backend.railway.app/api
   NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
   ```

3. **Deployer**
   - Vercel deploie automatiquement a chaque push sur main

#### Backend sur Railway

1. **Creer un projet sur Railway**
   - Aller sur [railway.app](https://railway.app)
   - Creer un nouveau projet
   - Ajouter un service PostgreSQL
   - Ajouter un service depuis GitHub (dossier backend)

2. **Configurer les variables d'environnement**
   ```
   DEBUG=False
   SECRET_KEY=votre-cle-secrete-production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ALLOWED_HOSTS=votre-backend.railway.app
   CORS_ALLOWED_ORIGINS=https://votre-app.vercel.app
   ```

3. **Fichier de deploiement**
   
   Creer `backend/Procfile` :
   ```
   web: gunicorn transferpro.wsgi --log-file -
   release: python manage.py migrate
   ```

4. **Configuration Whitenoise pour les fichiers statiques**
   
   Dans `settings.py` :
   ```python
   MIDDLEWARE = [
       'django.middleware.security.SecurityMiddleware',
       'whitenoise.middleware.WhiteNoiseMiddleware',
       # ... autres middlewares
   ]
   
   STATIC_ROOT = BASE_DIR / 'staticfiles'
   STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
   ```

---

### Option 2: Deploiement sur VPS (DigitalOcean, OVH, etc.)

#### 1. Preparer le serveur

```bash
# Mettre a jour le systeme
sudo apt update && sudo apt upgrade -y

# Installer les dependances
sudo apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib nodejs npm certbot python3-certbot-nginx

# Installer PM2 pour le frontend
sudo npm install -g pm2
```

#### 2. Configurer PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE transferpro;
CREATE USER transferpro_user WITH PASSWORD 'mot_de_passe_securise';
ALTER ROLE transferpro_user SET client_encoding TO 'utf8';
ALTER ROLE transferpro_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE transferpro_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE transferpro TO transferpro_user;
\q
```

#### 3. Deployer le Backend

```bash
# Cloner le projet
cd /var/www
git clone https://github.com/votre-repo/transferpro.git
cd transferpro/backend

# Creer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Configurer les variables d'environnement
cp .env.example .env
nano .env  # Modifier avec les bonnes valeurs

# Appliquer les migrations
python manage.py migrate
python manage.py collectstatic --noinput

# Creer le superutilisateur
python manage.py createsuperuser
```

#### 4. Configurer Gunicorn

Creer `/etc/systemd/system/transferpro.service` :

```ini
[Unit]
Description=TransferPro Django Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/transferpro/backend
Environment="PATH=/var/www/transferpro/backend/venv/bin"
EnvironmentFile=/var/www/transferpro/backend/.env
ExecStart=/var/www/transferpro/backend/venv/bin/gunicorn --workers 3 --bind unix:/var/www/transferpro/backend/transferpro.sock transferpro.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable transferpro
sudo systemctl start transferpro
```

#### 5. Deployer le Frontend

```bash
cd /var/www/transferpro

# Installer les dependances
npm install

# Creer le fichier .env.local
echo "NEXT_PUBLIC_API_URL=https://votre-domaine.com/api" > .env.local

# Build de production
npm run build

# Lancer avec PM2
pm2 start npm --name "transferpro-frontend" -- start
pm2 save
pm2 startup
```

#### 6. Configurer Nginx

Creer `/etc/nginx/sites-available/transferpro` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend Django API
    location /api {
        proxy_pass http://unix:/var/www/transferpro/backend/transferpro.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Django
    location /admin {
        proxy_pass http://unix:/var/www/transferpro/backend/transferpro.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Fichiers statiques Django
    location /static/ {
        alias /var/www/transferpro/backend/staticfiles/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/transferpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Configurer SSL avec Let's Encrypt

```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

---

## Maintenance

### Sauvegardes

#### Sauvegarde de la base de donnees

```bash
# Sauvegarde
pg_dump -U transferpro_user transferpro > backup_$(date +%Y%m%d).sql

# Restauration
psql -U transferpro_user transferpro < backup_20240115.sql
```

#### Script de sauvegarde automatique

Creer `/etc/cron.daily/backup-transferpro` :

```bash
#!/bin/bash
BACKUP_DIR=/var/backups/transferpro
mkdir -p $BACKUP_DIR
pg_dump -U transferpro_user transferpro | gzip > $BACKUP_DIR/backup_$(date +%Y%m%d).sql.gz
# Garder les 30 derniers jours
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Mise a jour

```bash
cd /var/www/transferpro

# Recuperer les mises a jour
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart transferpro

# Frontend
cd ..
npm install
npm run build
pm2 restart transferpro-frontend
```

### Logs

```bash
# Logs Backend
sudo journalctl -u transferpro -f

# Logs Frontend
pm2 logs transferpro-frontend

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Surveillance

Configurer des alertes avec des outils comme:
- **UptimeRobot** - Surveillance de disponibilite
- **Sentry** - Suivi des erreurs
- **New Relic** ou **Datadog** - Performance monitoring

---

## Support

Pour toute question ou probleme:
- Ouvrir une issue sur GitHub
- Contacter l'equipe technique a support@transferpro.com

---

*Derniere mise a jour: Janvier 2026*
