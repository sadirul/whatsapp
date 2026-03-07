# Deployment Guide - WPAnyWhere

Complete guide to deploy WPAnyWhere to production.

## 🏢 Production Architecture

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (CDN/DNS)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Load Balancer │
                    │   (nginx/HAProxy)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐        ┌──────▼──────┐      ┌────▼────┐
   │Frontend  │        │   Backend   │      │ Backend │
   │Instance1 │        │  Instance1  │      │Instance2│
   └──────────┘        └──────┬──────┘      └────┬────┘
                              │                  │
                         ┌────▼──────────────────▼─┐
                         │   MySQL Database       │
                         │   (AWS RDS/Azure)      │
                         └────────────────────────┘
```

---

## 🚀 Deployment Options

### Option 1: AWS (Recommended)

#### Prerequisites
- AWS Account
- AWS CLI configured
- EC2 permissions
- RDS permissions
- S3 permissions

#### Steps

**1. Database Setup (AWS RDS)**
```bash
# Create RDS MySQL instance
- Engine: MySQL 8.0
- Instance class: db.t3.micro
- Storage: 20 GB
- Multi-AZ: Yes (Production)
- Create subnet group
- Create security group
- Enable automated backups (7 days)
```

**2. Backend Deployment (EC2)**
```bash
# Launch EC2 instance
- AMI: Ubuntu 22.04 LTS
- Instance type: t3.small (minimum)
- Security group: Allow 3000, SSH
- Elastic IP: Yes

# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install dependencies
sudo apt update
sudo apt install -y nodejs npm
sudo apt install -y pm2

# Clone repository
git clone your-repo-url
cd mextjs/backend

# Install npm dependencies
npm install --production

# Configure environment
nano .env
# Set database credentials from RDS endpoint

# Start with PM2
pm2 start server.js --name "mextjs-backend"
pm2 startup
pm2 save

# Setup Nginx as reverse proxy
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/default
```

**3. Frontend Deployment (Vercel - Recommended)**
```bash
# Push to GitHub
git push origin main

# Go to https://vercel.com
# Import project
# Configure environment variables:
#   NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com

# Deploy
# Frontend automatically builds and deploys
```

---

### Option 2: Heroku

#### Prerequisites
- Heroku Account
- Heroku CLI installed
- Git repository

#### Steps

**1. Prepare for Heroku**
```bash
# Create Procfile
echo "web: node server.js" > backend/Procfile

# Add engine versions
npm run heroku-postbuild
```

**2. Deploy Backend**
```bash
# Login to Heroku
heroku login

# Create app
heroku create mextjs-backend

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set CORS_ORIGIN=https://your-frontend-domain

# Deploy
git push heroku main
```

**3. Deploy Frontend to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

---

### Option 3: DigitalOcean

#### Prerequisites
- DigitalOcean Account
- $5-10/month droplet

#### Steps

**1. Create Droplet**
```bash
# Create Ubuntu 22.04 droplet
# Choose $6/month (1 GB RAM, 1 vCPU, 25 GB SSD)
# Select region closest to users
```

**2. Initial Setup**
```bash
ssh root@your_droplet_ip

# Create non-root user
adduser mextjs
usermod -aG sudo mextjs

# Update packages
apt update && apt upgrade -y

# Install Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server
mysql_secure_installation

# Create database
mysql -u root -p
CREATE DATABASE mextjs;
CREATE USER 'mextjs'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON mextjs.* TO 'mextjs'@'localhost';
FLUSH PRIVILEGES;
exit
```

**3. Deploy Application**
```bash
# Clone repository
cd /home/mextjs
git clone your-repo-url
cd mextjs/backend

# Install dependencies
npm install --production

# Configure environment
nano .env

# Install PM2
npm install -g pm2
pm2 start server.js --name "mextjs"
pm2 startup
pm2 save

# Setup Nginx
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/mextjs
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/mextjs /etc/nginx/sites-enabled/

# Test and restart
nginx -t
systemctl restart nginx

# Setup SSL (Let's Encrypt)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## 🔒 Production Security Checklist

### Environment Variables
- [ ] Change JWT_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN to your frontend domain
- [ ] Use database credentials from secret manager

### Database
- [ ] Enable MySQL SSL
- [ ] Configure firewall rules
- [ ] Enable automated backups
- [ ] Test disaster recovery
- [ ] Monitor disk space
- [ ] Set up replication

### Application
- [ ] Enable HTTPS/SSL everywhere
- [ ] Setup rate limiting
- [ ] Configure request logging
- [ ] Enable error tracking (Sentry)
- [ ] Monitor performance (New Relic)
- [ ] Setup alerting
- [ ] Regular security audits

### Infrastructure
- [ ] Use VPC/Private networks
- [ ] Configure load balancing
- [ ] Setup auto-scaling
- [ ] Monitor uptime
- [ ] Implement DDoS protection
- [ ] Setup WAF (Web Application Firewall)

---

## 📊 Monitoring & Maintenance

### Application Monitoring
```bash
# Use PM2 Plus
pm2 plus

# Alternative: New Relic
npm install newrelic
```

### Database Monitoring
```bash
# Monitor queries
SHOW PROCESSLIST;

# Monitor replication
SHOW SLAVE STATUS\G

# Backup
mysqldump -u root -p mextjs > backup.sql
```

### Log Aggregation
```bash
# Use ELK Stack or Splunk
# Forward logs from Nginx and Node.js
```

### Performance Monitoring
```bash
# Monitor CPU, Memory, Disk
top
df -h
du -sh /path/to/dir

# Monitor network
iftop
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Deploy backend
        run: |
          ssh -i ${{ secrets.DEPLOY_KEY }} user@server 'cd /app && git pull && npm install --production && pm2 restart mextjs'
      
      - name: Deploy frontend
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 🛠️ Backup & Recovery

### Database Backup
```bash
# Daily backup
0 2 * * * mysqldump -u root -p$MYSQL_PASSWORD mextjs | gzip > /backups/mextjs-$(date +\%Y\%m\%d).sql.gz

# Upload to S3
aws s3 sync /backups s3://your-backup-bucket/
```

### Recovery
```bash
# Restore from backup
gunzip < backup.sql.gz | mysql -u root -p mextjs
```

---

## 📈 Scaling Strategies

### Horizontal Scaling
1. Deploy multiple backend instances
2. Setup load balancer (nginx, HAProxy)
3. Use session store (Redis, Memcached)
4. Database replication (Master-Slave)

### Vertical Scaling
1. Increase server resources (CPU, RAM)
2. Optimize database queries
3. Implement caching
4. Use CDN for static files

### Database Optimization
```sql
-- Add indexes
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_api_key ON users(api_key);
CREATE INDEX idx_whatsapp_status ON users(whatsapp_status);

-- Monitor slow queries
SHOW VARIABLES LIKE 'slow_query%';
SET GLOBAL slow_query_log = 'ON';
```

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| High Memory Usage | Check for memory leaks, restart application |
| Slow Queries | Add database indexes, optimize queries |
| Connection Pool Exhausted | Increase pool size or add more database instances |
| SSL Certificate Expired | Renew with certbot or your provider |
| Application Crash | Check logs, monitor resources, setup auto-restart |

---

## 🎯 Cost Estimation (Monthly)

**AWS:**
- EC2 (t3.small): $15
- RDS MySQL: $20
- Bandwidth: $5-10
- **Total: ~$40-50/month**

**DigitalOcean:**
- App Platform: $12-25
- Managed MySQL: $15
- **Total: ~$27-40/month**

**Heroku:**
- Backend: $7
- Frontend (Vercel): Free-$20
- MySQL: $9+
- **Total: ~$16-36/month**

---

## 📚 Additional Resources

- AWS Deployment: https://aws.amazon.com/getting-started/
- Docker Production: https://docs.docker.com/develop/deploy-docker/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Website Security: https://owasp.org/

---

Last Updated: 2026-02-05
