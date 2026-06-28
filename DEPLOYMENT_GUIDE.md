# 🚀 Deployment Guide - Enterprise Ads Management System

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Production Setup](#production-setup)
4. [Environment Configuration](#environment-configuration)
5. [Security Hardening](#security-hardening)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Backup Strategy](#backup-strategy)
9. [Scaling Strategy](#scaling-strategy)

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 22.04 LTS or CentOS 8+ (recommended)
- **PHP**: 8.4 or higher
- **Web Server**: Nginx (recommended) or Apache 2.4+
- **Database**: MySQL 8.0+ or MariaDB 10.6+
- **Cache**: Redis 7.0+ (recommended) or Memcached
- **Queue**: Redis, Beanstalkd, or SQS
- **Node.js**: 18+ LTS
- **Memory**: Minimum 2GB RAM (4GB+ recommended for 500+ apps)
- **Storage**: SSD with 50GB+ available space

### PHP Extensions Required
```bash
php -m | grep -E 'openssl|pdo|mbstring|tokenizer|xml|ctype|json|bcmath|redis|gd'
```

Required extensions:
- OpenSSL
- PDO
- Mbstring
- Tokenizer
- XML
- Ctype
- JSON
- BCMath
- Redis (for caching)
- GD or Imagick (for image processing)

## Production Setup

### 1. Clone Repository
```bash
cd /var/www
git clone https://github.com/your-org/ads-management.git
cd ads-management
```

### 2. Install Dependencies
```bash
# Install Composer dependencies (production only, optimized)
composer install --no-dev --optimize-autoloader --no-interaction

# Install Node dependencies
npm ci --production

# Build frontend assets
npm run build
```

### 3. Set Permissions
```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/ads-management

# Set directory permissions
sudo find /var/www/ads-management -type d -exec chmod 755 {} \;
sudo find /var/www/ads-management -type f -exec chmod 644 {} \;

# Set storage and cache permissions
sudo chmod -R 775 /var/www/ads-management/storage
sudo chmod -R 775 /var/www/ads-management/bootstrap/cache
```

### 4. Configure Environment
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit .env file
nano .env
```

## Environment Configuration

### Essential Production Settings
```env
# Application
APP_NAME="Ads Management System"
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_DEBUG=false
APP_URL=https://ads.yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ads_management_prod
DB_USERNAME=ads_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# Cache (Redis recommended)
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
REDIS_PORT=6379
REDIS_DB=0
REDIS_CACHE_DB=1

# Mail (for notifications)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error
LOG_DEPRECATIONS_CHANNEL=null

# Security
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_SAME_SITE=strict
```

### 5. Database Setup
```bash
# Create database
mysql -u root -p << EOF
CREATE DATABASE ads_management_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ads_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON ads_management_prod.* TO 'ads_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Run migrations
php artisan migrate --force

# Seed initial data
php artisan db:seed --force
```

## Nginx Configuration

### Create Nginx Config
```nginx
# /etc/nginx/sites-available/ads-management

server {
    listen 80;
    listen [::]:80;
    server_name ads.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ads.yourdomain.com;
    root /var/www/ads-management/public;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ads.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ads.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Index files
    index index.php index.html;

    charset utf-8;

    # Main location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;

        # Security
        fastcgi_param PHP_VALUE "upload_max_filesize=50M \n post_max_size=50M";
        fastcgi_buffer_size 128k;
        fastcgi_buffers 256 16k;
        fastcgi_busy_buffers_size 256k;
        fastcgi_temp_file_write_size 256k;
        fastcgi_read_timeout 600;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Rate limiting for API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Logging
    access_log /var/log/nginx/ads-management-access.log;
    error_log /var/log/nginx/ads-management-error.log;

    # File upload size
    client_max_body_size 50M;
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/ads-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Security Hardening

### 1. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ads.yourdomain.com
sudo certbot renew --dry-run
```

### 2. Firewall Configuration
```bash
# UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2Ban for brute force protection
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Secure File Permissions
```bash
# Remove write permissions from web server
sudo chmod -R 755 /var/www/ads-management
sudo chmod -R 775 storage bootstrap/cache

# Protect .env file
sudo chmod 600 .env
```

### 4. Disable Unnecessary Services
```bash
# Check running services
sudo systemctl list-units --type=service --state=running

# Disable unnecessary services
sudo systemctl disable apache2  # if using Nginx
```

## Performance Optimization

### 1. PHP-FPM Optimization
Edit `/etc/php/8.4/fpm/pool.d/www.conf`:
```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500

; PHP settings
php_admin_value[memory_limit] = 256M
php_admin_value[max_execution_time] = 300
php_admin_value[upload_max_filesize] = 50M
php_admin_value[post_max_size] = 50M
```

### 2. Laravel Optimization
```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize

# Optimize application
php artisan optimize
```

### 3. Database Optimization
```sql
-- Add indexes for frequent queries
ALTER TABLE applications ADD INDEX idx_status (status);
ALTER TABLE applications ADD INDEX idx_package_name (package_name);
ALTER TABLE ad_units ADD INDEX idx_app_type_enabled (application_id, ad_type, is_enabled);
ALTER TABLE api_logs ADD INDEX idx_created (created_at);
ALTER TABLE audit_logs ADD INDEX idx_created (created_at);

-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

### 4. Redis Configuration
Edit `/etc/redis/redis.conf`:
```conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Queue Worker Setup

### Supervisor Configuration
Create `/etc/supervisor/conf.d/ads-management-worker.conf`:
```ini
[program:ads-management-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ads-management/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/ads-management/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ads-management-worker:*
```

## Monitoring & Maintenance

### 1. Setup Cron Jobs
```bash
sudo crontab -e -u www-data
```

Add:
```cron
# Laravel Scheduler
* * * * * cd /var/www/ads-management && php artisan schedule:run >> /dev/null 2>&1

# Database Backup (daily at 2 AM)
0 2 * * * cd /var/www/ads-management && php artisan backup:run

# Clean old logs (weekly)
0 3 * * 0 cd /var/www/ads-management && php artisan api:logs:clean --days=30
0 3 * * 0 cd /var/www/ads-management && php artisan audit:logs:clean --days=90
```

### 2. Log Rotation
Create `/etc/logrotate.d/ads-management`:
```
/var/www/ads-management/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0664 www-data www-data
    sharedscripts
}
```

### 3. Monitoring Tools
```bash
# Install monitoring
sudo apt install htop iotop nethogs

# Laravel Telescope (for staging/development)
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

## Backup Strategy

### Automated Database Backup
```bash
#!/bin/bash
# /usr/local/bin/backup-ads-db.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/ads-management"
DB_NAME="ads_management_prod"
DB_USER="ads_user"
DB_PASS="YOUR_PASSWORD"

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Backup files
tar -czf $BACKUP_DIR/files_$TIMESTAMP.tar.gz /var/www/ads-management/storage/app

# Delete old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/db_$TIMESTAMP.sql.gz s3://your-bucket/backups/
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-ads-db.sh
```

## Scaling Strategy

### Horizontal Scaling
1. **Load Balancer**: Setup Nginx or HAProxy
2. **Database Replication**: Master-slave MySQL setup
3. **Shared Storage**: NFS or S3 for file uploads
4. **Redis Cluster**: For distributed caching
5. **Queue Workers**: Distribute across multiple servers

### Vertical Scaling
- Increase RAM to 8GB+ for 500+ apps
- Use SSD storage
- Optimize database queries
- Enable OPcache

### Performance Targets
- **API Response Time**: < 100ms (p95)
- **Page Load Time**: < 2s
- **Database Query Time**: < 50ms (p95)
- **Uptime**: 99.9%

## Health Checks

### Application Health Check
```bash
# Check application status
curl https://ads.yourdomain.com/api/health

# Check queue status
php artisan queue:monitor redis

# Check database connection
php artisan tinker
>>> DB::connection()->getPdo();
```

### System Health
```bash
# Check services
systemctl status nginx php8.4-fpm mysql redis supervisor

# Check disk space
df -h

# Check memory
free -h

# Check load
uptime
```

## Troubleshooting

### Clear All Caches
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
composer dump-autoload
```

### Reset Queue
```bash
php artisan queue:restart
sudo supervisorctl restart ads-management-worker:*
```

### Check Logs
```bash
# Application logs
tail -f storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/ads-management-error.log

# PHP-FPM logs
tail -f /var/log/php8.4-fpm.log
```

## Post-Deployment Checklist

- [ ] Change default admin password
- [ ] Configure email settings
- [ ] Setup SSL certificate
- [ ] Configure firewall rules
- [ ] Setup automated backups
- [ ] Configure monitoring
- [ ] Test API endpoints
- [ ] Verify queue workers
- [ ] Check log rotation
- [ ] Review security headers
- [ ] Load test application
- [ ] Document custom configurations

## Support & Maintenance

For issues or questions:
1. Check application logs: `storage/logs/laravel.log`
2. Review audit logs in admin panel
3. Contact development team

---

**Last Updated**: 2025-01-01
**Version**: 1.0.0
