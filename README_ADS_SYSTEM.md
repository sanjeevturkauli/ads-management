# Enterprise Mobile App Ads Management System

## 🚀 Overview

A production-ready, enterprise-grade system for managing 500+ Android and iOS mobile applications from a single admin panel. Built with Laravel 13, Inertia.js, React 19, and TypeScript.

## ✨ Key Features

### 🔐 Security First
- **Automatic Encryption**: All sensitive data (Ad IDs, API Keys, OAuth Tokens) encrypted at rest
- **Role-Based Access Control (RBAC)**: 5 predefined roles with granular permissions
- **API Key Authentication**: Secure REST API with rate limiting and IP protection
- **Comprehensive Audit Logging**: Track every action with user, IP, browser, and device info

### 📱 Application Management
- Manage 500+ mobile apps from one dashboard
- Support for Android, iOS, and cross-platform apps
- Per-app configuration overrides
- Version management with force update capability
- Maintenance mode per application

### 💰 Advanced Ads Management
- **6 Ad Types**: Banner, Interstitial, Rewarded, Rewarded Interstitial, Native, App Open
- **Multiple Ad Networks**: AdMob, Meta Audience Network, Unity, AppLovin, ironSource
- **Waterfall Configuration**: Priority-based ad serving
- **Frequency Control**: Configure ad display intervals
- **Ad Caps**: Daily and hourly impression limits
- **Global & Per-App Settings**: Flexible configuration hierarchy

### 🔑 API Key Management
- Generate secure API keys per application
- Key rotation and revocation
- Rate limiting (configurable per key)
- IP whitelisting
- Domain restrictions
- Usage statistics and last used tracking

### 📊 Analytics & Monitoring
- Real-time dashboard with statistics
- API usage tracking and charts
- Top applications by API calls
- Success/failure rate monitoring
- Response time tracking

### 🔍 Audit & Compliance
- Complete audit trail for all operations
- Track creates, updates, deletes
- User identification with IP and device info
- Searchable and filterable logs
- Export capabilities

## 🏗️ Architecture

### Clean Architecture Principles
```
┌─────────────────────────────────────┐
│        Controllers Layer            │  ← Coordination only
├─────────────────────────────────────┤
│         Services Layer              │  ← Business logic
├─────────────────────────────────────┤
│       Repositories Layer            │  ← Data access
├─────────────────────────────────────┤
│          Models Layer               │  ← Domain entities
└─────────────────────────────────────┘
```

### Key Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic separation
- **DTO Pattern**: Type-safe data transfer
- **Form Requests**: Validation and authorization
- **Policies**: Resource authorization
- **Events & Listeners**: Decoupled event handling
- **Action Classes**: Single-responsibility operations

## 📦 Database Schema

### Core Tables
- `applications` - Mobile app registry (UUID primary keys)
- `ad_networks` - Ad network providers
- `ad_units` - Ad configurations per app
- `api_keys` - API authentication keys
- `global_settings` - System-wide configuration
- `app_settings` - Per-app configuration overrides
- `app_versions` - Version management
- `audit_logs` - Complete audit trail
- `api_logs` - API request/response logging

### Security Tables
- `roles` - User roles
- `permissions` - Granular permissions
- `role_user` - User-role assignments
- `permission_role` - Role-permission assignments

## 🔐 Security Features

### Encryption
All sensitive data is automatically encrypted using Laravel's encryption:
```php
protected $encryptable = [
    'encrypted_api_key',
    'encrypted_ad_unit_id',
];
```

### Masking
Sensitive values are masked in the admin panel:
```
ca-app-pub-********1234
ak_****************************************************************
```

### Access Control
```php
// Middleware
'role:super-admin'
'permission:applications.create'

// Model methods
$user->isSuperAdmin()
$user->hasPermission('ad_units.update')
$user->hasRole('admin')
```

### API Authentication
```bash
# Header-based
curl -H "X-API-Key: your-api-key" https://api.example.com/v1/config

# Query parameter
https://api.example.com/v1/config?api_key=your-api-key
```

## 🎯 User Roles

### Super Admin
- Full system access
- View/edit encrypted values
- Manage users and roles
- Access audit logs
- Export data

### Admin
- Manage applications
- Manage ad units
- Generate API keys
- View audit logs

### Manager
- Create/update applications
- Manage ad units
- Generate API keys

### Editor
- Update applications
- Update ad units
- Toggle ad enable/disable

### Viewer
- Read-only access
- View statistics
- View configurations

## 🔌 API Endpoints

### Configuration API
```bash
# Get application configuration
GET /api/v1/config/{package_name}
Headers: X-API-Key: your-api-key

# Response
{
  "success": true,
  "data": {
    "package_name": "com.example.app",
    "ads_enabled": true,
    "banner_id": "ca-app-pub-xxx",
    "interstitial_id": "ca-app-pub-xxx",
    "rewarded_id": "ca-app-pub-xxx",
    "native_id": "ca-app-pub-xxx",
    "app_open_id": "ca-app-pub-xxx",
    "interstitial_interval": 3,
    "maintenance": false,
    "force_update": false,
    "current_version": "1.0.0",
    "minimum_version": "1.0.0",
    "latest_version": "1.2.0",
    "ads": {
      "banner": {
        "enabled": true,
        "ad_unit_id": "ca-app-pub-xxx",
        "frequency": 1,
        "refresh_interval": 60,
        "network": "admob"
      }
    }
  }
}
```

### Health Check
```bash
GET /api/health

{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

## 🚀 Installation

### Prerequisites
- PHP 8.4+
- Composer
- Node.js 18+
- MySQL 8+
- Redis (optional, for caching)

### Setup
```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ads_management
DB_USERNAME=root
DB_PASSWORD=

# Run migrations
php artisan migrate

# Seed database (creates super admin + defaults)
php artisan db:seed

# Build frontend assets
npm run build

# Start development server
php artisan serve
```

### Default Credentials
```
Email: admin@example.com
Password: password
```

**⚠️ IMPORTANT: Change the default password immediately after first login!**

## 📝 Configuration

### Global Settings
Global settings can be configured via the admin panel or directly in the database:

```php
GlobalSetting::set('ads_enabled', true, 'boolean');
GlobalSetting::set('interstitial_interval', 3, 'integer');
GlobalSetting::set('review_dialog_enabled', true, 'boolean');
```

### Per-App Settings
Each application can override global settings:

```php
$application->setSetting('ads_enabled', false, 'boolean');
$application->setSetting('force_update', true, 'boolean');
```

### Ad Network Configuration
Configure ad networks in the `ad_networks` table:

- AdMob (default)
- Meta Audience Network
- Unity Ads
- AppLovin
- ironSource

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific test
php artisan test --filter=ApplicationTest
```

## 📊 Monitoring & Logs

### API Logs
All API requests are logged with:
- Request/response data
- Response time
- IP address
- User agent
- Error messages

### Audit Logs
All system actions are logged with:
- User information
- Action type (create/update/delete)
- Old and new values
- IP, browser, device info
- Timestamp

### Access Logs
```php
// Query audit logs
AuditLog::module('Application')
    ->action('update')
    ->user($userId)
    ->latest()
    ->paginate(50);
```

## 🔧 Maintenance

### Clear Caches
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Optimize for Production
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### Database Maintenance
```bash
# Backup database
php artisan db:backup

# Clean old API logs (older than 30 days)
php artisan api:logs:clean --days=30

# Clean old audit logs (older than 90 days)
php artisan audit:logs:clean --days=90
```

## 🔐 Security Best Practices

1. **Change Default Credentials**: Immediately after installation
2. **Use HTTPS**: Always in production
3. **Rate Limiting**: Configure appropriate limits per API key
4. **Regular Audits**: Review audit logs regularly
5. **Key Rotation**: Rotate API keys periodically
6. **Backup**: Regular database backups
7. **Update Dependencies**: Keep packages up-to-date
8. **Environment Variables**: Never commit `.env` file

## 📚 Code Structure

```
app/
├── Actions/              # Single-responsibility action classes
├── Concerns/            # Reusable traits
├── DataTransferObjects/ # DTOs for type-safe data transfer
├── Http/
│   ├── Controllers/     # Request coordination
│   ├── Middleware/      # Request/response filtering
│   └── Requests/        # Form validation & authorization
├── Models/              # Eloquent models
│   └── Concerns/        # Model traits (HasEncryption, HasAuditLog)
├── Policies/            # Authorization policies
├── Repositories/        # Data access layer
└── Services/            # Business logic layer

database/
├── factories/           # Model factories
├── migrations/          # Database schema
└── seeders/            # Default data

resources/
├── css/                # Styles
└── js/
    ├── actions/        # Frontend API calls
    ├── components/     # React components
    ├── hooks/          # Custom React hooks
    ├── pages/          # Inertia pages
    └── types/          # TypeScript definitions
```

## 🎨 Frontend (React + TypeScript)

### Shadcn UI Components
- Beautiful, accessible components
- Dark mode support
- Fully customizable

### Key Features
- Server-side pagination
- Real-time search and filtering
- Bulk actions
- Toast notifications
- Confirmation dialogs
- Skeleton loading states
- Error boundaries

## 🐛 Troubleshooting

### Common Issues

**Issue**: API returns 401 Unauthorized
```bash
# Check API key is valid
# Verify API key is active
# Check rate limits
```

**Issue**: Encrypted values not decrypting
```bash
# Ensure APP_KEY is set correctly
# Don't change APP_KEY after encrypting data
```

**Issue**: Permissions not working
```bash
# Clear cache
php artisan cache:clear

# Re-seed roles and permissions
php artisan db:seed --class=RolePermissionSeeder
```

## 📄 License

This project is proprietary and confidential.

## 👥 Support

For support, contact your system administrator or development team.

---

**Built with ❤️ using Laravel 13, Inertia.js, React 19, and TypeScript**
