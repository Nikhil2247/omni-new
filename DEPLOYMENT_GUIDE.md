# Omnicassion VPS Deployment Guide

Complete step-by-step guide to deploy Omnicassion on a VPS with PM2.

---

## Prerequisites

- Ubuntu 22.04+ VPS (minimum 4GB RAM, 2 CPU cores)
- Root or sudo access
- Domain names configured (e.g., omnicassion.com, api.omnicassion.com, files.omnicassion.com)

---

## Step 1: Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw
```

---

## Step 2: Install Node.js 22

```bash
# Install Node.js 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs

# Verify installation
node -v  # Should show v22.x.x
npm -v

# Install global packages
npm install -g pm2 serve
```

---

## Step 3: Install Docker (for Infrastructure)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Enable Docker service
systemctl enable docker
systemctl start docker

# Verify
docker --version
docker compose version
```

---

## Step 4: Configure Firewall

```bash
# Enable UFW
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Check status
ufw status
```

---

## Step 5: Clone Repository

```bash
# Create project directory
mkdir -p /root/omnicassion
cd /root/omnicassion

# Clone the repository
git clone https://github.com/YOUR_USERNAME/omni-new.git
cd omni-new

# Set git config
git config user.email "deploy@omnicassion.com"
git config user.name "Deploy"
```

---

## Step 6: Deploy Infrastructure (PostgreSQL, Dragonfly, MinIO, Meilisearch)

```bash
cd /root/omnicassion/omni-new

# Create environment file for infrastructure (optional overrides)
cat > .env.infra << 'EOF'
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=omnicassion
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_minio_password_here
MINIO_DEFAULT_BUCKETS=omnicassion
MEILI_MASTER_KEY=your_meilisearch_key_here
EOF

# Start infrastructure containers
docker compose -f docker-compose.infra.yml up -d

# Verify all containers are running
docker ps

# Expected containers:
# - infra-postgres (PostgreSQL on port 5432)
# - infra-dragonfly (Redis-compatible on port 6379)
# - infra-minio (S3 on ports 9000, 9001)
# - infra-meilisearch (Search on port 7700)

# Check logs if needed
docker logs infra-postgres
docker logs infra-dragonfly
docker logs infra-minio
docker logs infra-meilisearch
```

---

## Step 7: Setup Backend

```bash
cd /root/omnicassion/omni-new/backend

# Install dependencies
npm ci

# Create environment file
cat > .env << 'EOF'
# App
NODE_ENV=production
PORT=3001

# Database (connects to infra-postgres container)
DATABASE_URL=postgresql://postgres:your_secure_password_here@localhost:5432/omnicassion

# Redis/Dragonfly (connects to infra-dragonfly container)
REDIS_URL=redis://localhost:6379

# MinIO (connects to infra-minio container)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your_minio_password_here
MINIO_BUCKET=omnicassion
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=https://files.omnicassion.com

# Meilisearch (connects to infra-meilisearch container)
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your_meilisearch_key_here

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Add other environment variables as needed...
EOF

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Start with PM2
pm2 start dist/main.js --name omni-backend --node-args="--max-old-space-size=1024"

# Save PM2 process list
pm2 save

# Verify backend is running
curl http://localhost:3001/health
```

---

## Step 8: Setup Frontend

```bash
cd /root/omnicassion/omni-new/frontend

# Install dependencies
npm ci

# Create environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://api.omnicassion.com
NEXT_PUBLIC_WS_URL=https://api.omnicassion.com
NEXT_PUBLIC_SOCKET_PATH=/api/socket.io
NEXT_PUBLIC_APP_NAME=Omnicassion
NEXT_PUBLIC_APP_ENV=production
EOF

# Build the application (creates 'out' folder for static export)
npm run build

# Start with PM2 using serve
pm2 start "npx serve -s out -l 3000" --name omni-frontend

# Save PM2 process list
pm2 save

# Verify frontend is running
curl http://localhost:3000
```

---

## Step 9: Configure PM2 Startup

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Run the outputted command, then:
pm2 save

# Verify PM2 processes
pm2 list
```

---

## Step 10: Configure Nginx

```bash
# Create nginx configuration
cat > /etc/nginx/sites-available/omnicassion << 'EOF'
# Frontend - omnicassion.com
server {
    listen 80;
    server_name omnicassion.com www.omnicassion.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API - api.omnicassion.com
server {
    listen 80;
    server_name api.omnicassion.com backend.omnicassion.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}

# MinIO Files - files.omnicassion.com
server {
    listen 80;
    server_name files.omnicassion.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# MinIO Console - minio.omnicassion.com (optional)
server {
    listen 80;
    server_name minio.omnicassion.com;

    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/omnicassion /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

---

## Step 11: Setup SSL with Certbot

```bash
# Get SSL certificates for all domains
certbot --nginx -d omnicassion.com -d www.omnicassion.com -d api.omnicassion.com -d backend.omnicassion.com -d files.omnicassion.com

# Auto-renewal is configured automatically
# Test auto-renewal
certbot renew --dry-run
```

---

## Step 12: Setup GitHub Actions Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following **Secrets**:

| Secret Name | Value |
|-------------|-------|
| `VPS_HOST` | Your VPS IP address (e.g., `147.93.106.69`) |
| `VPS_USERNAME` | `root` |
| `VPS_SSH_KEY` | Your private SSH key (entire content including BEGIN/END lines) |
| `ACCESS_TOKEN` | GitHub Personal Access Token with repo access |

Add the following **Variables** (Settings → Variables):

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.omnicassion.com` |
| `NEXT_PUBLIC_WS_URL` | `https://api.omnicassion.com` |
| `NEXT_PUBLIC_SOCKET_PATH` | `/socket.io` |
| `NEXT_PUBLIC_APP_NAME` | `Omnicassion` |

---

## Step 13: Generate SSH Key for GitHub Actions

```bash
# On your local machine or VPS
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_key -N ""

# Copy the public key to VPS authorized_keys
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys

# Copy the private key content for GitHub secret (VPS_SSH_KEY)
cat ~/.ssh/github_actions_key
```

---

## Useful Commands

### PM2 Management
```bash
# View all processes
pm2 list

# View logs
pm2 logs omni-backend
pm2 logs omni-frontend

# Restart services
pm2 restart omni-backend
pm2 restart omni-frontend

# Stop services
pm2 stop all

# Monitor resources
pm2 monit
```

### Docker Infrastructure
```bash
# View running containers
docker ps

# View logs
docker logs -f infra-postgres
docker logs -f infra-dragonfly

# Restart infrastructure
docker compose -f docker-compose.infra.yml restart

# Stop infrastructure
docker compose -f docker-compose.infra.yml down

# Start infrastructure
docker compose -f docker-compose.infra.yml up -d
```

### Manual Deployment
```bash
# Deploy backend manually
cd /root/omnicassion/omni-new
git pull origin main
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 reload omni-backend

# Deploy frontend manually
cd /root/omnicassion/omni-new/frontend
npm ci
npm run build
pm2 reload omni-frontend
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs omni-backend --lines 100

# Check if port is in use
lsof -i :3001

# Check database connection
docker exec infra-postgres pg_isready -U postgres
```

### Frontend not loading
```bash
# Check if build succeeded
ls -la /root/omnicassion/omni-new/frontend/out

# Check serve process
pm2 logs omni-frontend

# Check nginx
nginx -t
systemctl status nginx
```

### Infrastructure issues
```bash
# Check all container statuses
docker ps -a

# Restart all infrastructure
docker compose -f docker-compose.infra.yml down
docker compose -f docker-compose.infra.yml up -d

# Check resource usage
docker stats
```

---

## Port Reference

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js static (serve) |
| Backend | 3001 | NestJS API |
| PostgreSQL | 5432 | Database |
| Dragonfly | 6379 | Redis-compatible cache |
| MinIO API | 9000 | S3-compatible storage |
| MinIO Console | 9001 | MinIO web UI |
| Meilisearch | 7700 | Search engine |
| Nginx | 80/443 | Reverse proxy |

---

## Resource Usage (Optimized for 5GB RAM)

| Component | RAM | CPU |
|-----------|-----|-----|
| PostgreSQL | 2GB | 1.0 |
| Dragonfly | 1GB | 0.5 |
| MinIO | 768MB | 0.5 |
| Meilisearch | 768MB | 0.5 |
| Backend (PM2) | ~512MB | Variable |
| Frontend (serve) | ~128MB | Variable |
| **Total** | ~5GB | ~2.5 cores |
