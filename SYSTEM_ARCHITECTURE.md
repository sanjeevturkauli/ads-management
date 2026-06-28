# 🏗️ System Architecture Documentation

## Executive Summary

An enterprise-grade, production-ready Mobile App Ads Management System built with Laravel 13, Inertia.js, React 19, and TypeScript. Designed to manage 500+ mobile applications from a single admin panel with advanced security, scalability, and maintainability.

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Applications                       │
│            (Android & iOS - 500+ Apps)                      │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API (JSON)
                     │ X-API-Key Authentication
                     │ Rate Limited
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│  • ApiKeyAuthentication Middleware                          │
│  • LogApiRequest Middleware                                 │
│  • Rate Limiting                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Controllers Layer                          │
│  • Request Coordination Only                                │
│  • No Business Logic                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Services Layer                            │
│  • ApplicationService                                       │
│  • AdUnitService                                           │
│  • ApiKeyService                                           │
│  • ConfigService                                           │
│  (Business Logic Resides Here)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repositories Layer                          │
│  • ApplicationRepository                                    │
│  • AdUnitRepository                                        │
│  • ApiKeyRepository                                        │
│  • AuditLogRepository                                      │
│  (Data Access Abstraction)                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Models Layer                             │
│  • Eloquent ORM                                            │
│  • Relationships                                           │
│  • Scopes & Accessors                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
│  MySQL 8+ with Optimized Indexes                           │
│  • 11 Core Tables                                          │
│  • Foreign Keys & Constraints                              │
│  • UUID Primary Keys                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Cross-Cutting Concerns                     │
├─────────────────────────────────────────────────────────────┤
│ • Encryption (HasEncryption Trait)                         │
│ • Audit Logging (HasAuditLog Trait)                        │
│ • Caching (Redis)                                          │
│ • Queue System (Jobs)                                      │
│ • Event System (Events & Listeners)                        │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Authentication & Authorization

#### Multi-Layer Security
```
Request → API Key Check → Role Check → Permission Check → Resource Access
```

#### Components
- **ApiKeyAuthentication**: Validates API keys, checks IP restrictions
- **CheckRole**: Verifies user has required role
- **CheckPermission**: Validates specific permission (Super Admin bypasses)
- **RBAC System**: 5 roles, 20+ permissions

### 2. Data Flow

#### Admin Panel Request Flow
```
User Request
    ↓
Route (web.php)
    ↓
Middleware (auth, verified, role, permission)
    ↓
Controller (Admin/ApplicationController)
    ↓
Form Request Validation
    ↓
Service Layer (ApplicationService)
    ↓
Repository Layer (ApplicationRepository)
    ↓
Model (Application)
    ↓
Database
    ↓
Response (Inertia Page)
    ↓
React Component
```

#### API Request Flow
```
Mobile App Request
    ↓
Route (api.php)
    ↓
Middleware (api.key, api.log)
    ↓
Controller (Api/ConfigController)
    ↓
Service Layer (ConfigService)
    ↓
Repository Layer (ApplicationRepository)
    ↓
Model with Relationships
    ↓
Database (with eager loading)
    ↓
DTO (ApiConfigData)
    ↓
JSON Response
    ↓
Mobile App
```

## Database Schema

### Entity Relationship Diagram
```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    users    │────────▶│  role_user   │◀────────│    roles    │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         ▼
                                                  ┌──────────────────┐
                                                  │ permission_role  │
                                                  └──────────────────┘
                                                         ▲
                                                         │
                                                  ┌─────────────┐
                                                  │ permissions │
                                                  └─────────────┘

┌──────────────────┐
│  applications    │
│ • id (UUID)      │
│ • package_name   │──┐
│ • status         │  │
│ • encrypted_key  │  │
└──────────────────┘  │
        │             │
        │             │
        ▼             ▼
┌──────────────────┐  ┌──────────────────┐
│    ad_units      │  │    api_keys      │
│ • app_id (FK)    │  │ • app_id (FK)    │
│ • ad_type        │  │ • encrypted_key  │
│ • encrypted_id   │  │ • key_hash       │
│ • priority       │  │ • rate_limit     │
└──────────────────┘  └──────────────────┘
        │                      │
        │                      │
        ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│   ad_networks    │  │    api_logs      │
│ • provider       │  │ • endpoint       │
│ • priority       │  │ • response_time  │
└──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  app_settings    │  │ global_settings  │
│ • app_id (FK)    │  │ • key            │
│ • key            │  │ • value          │
│ • value          │  │ • is_encrypted   │
│ • overrides      │  │ • is_public      │
└──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│   audit_logs     │  │   app_versions   │
│ • user_id        │  │ • app_id (FK)    │
│ • action         │  │ • version        │
│ • old_values     │  │ • is_forced      │
│ • new_values     │  │ • is_latest      │
│ • ip_address     │  └──────────────────┘
└──────────────────┘
```

### Key Tables

#### applications
- **Purpose**: Store mobile app metadata
- **Security**: Encrypted API keys, soft deletes
- **Indexes**: package_name, status, platform

#### ad_units
- **Purpose**: Ad configurations per app
- **Security**: Encrypted ad unit IDs
- **Indexes**: app_id + ad_type + enabled, priority

#### api_keys
- **Purpose**: API authentication
- **Security**: Encrypted keys, hashed for lookup
- **Indexes**: key_hash, app_id, status

#### audit_logs
- **Purpose**: Complete audit trail
- **Storage**: Old/new values, user context
- **Indexes**: auditable, user_id, created_at, module + action

## Security Architecture

### Encryption Strategy

#### Automatic Encryption
```php
// HasEncryption Trait
protected $encryptable = [
    'encrypted_api_key',
    'encrypted_ad_unit_id',
];

// Automatic on save
$application->encrypted_api_key = 'plain-text';
$application->save(); // Encrypted automatically

// Automatic on retrieve
$decrypted = $application->getDecrypted('encrypted_api_key');
```

#### Encryption Flow
```
Plain Text → Save → Crypt::encryptString() → Database (encrypted)
                           ↓
Database (encrypted) → Retrieve → Crypt::decryptString() → Plain Text
```

### Masking Strategy
```php
// API Key: ak_1234...5678 → ak_********5678
// Ad Unit: ca-app-pub-1234567890 → ca-app-pub-********7890
```

### Role-Based Access Control

#### Permission Hierarchy
```
Super Admin
    └─ All Permissions (automatic)

Admin
    ├─ applications.*
    ├─ ad_units.*
    ├─ api_keys.* (except delete)
    ├─ settings.update
    └─ audit_logs.view

Manager
    ├─ applications.view, create, update
    ├─ ad_units.view, create, update, toggle
    └─ api_keys.view, create

Editor
    ├─ applications.view, update
    └─ ad_units.view, update, toggle

Viewer
    ├─ applications.view
    ├─ ad_units.view
    └─ api_keys.view
```

## Performance Optimization

### Caching Strategy
```
┌────────────────────────────────────────┐
│          Cache Layers                  │
├────────────────────────────────────────┤
│ 1. Global Settings (forever)           │
│ 2. Application Config (1 hour)         │
│ 3. Ad Units (30 minutes)               │
│ 4. API Rate Limits (1 hour)            │
└────────────────────────────────────────┘
```

### Database Optimization
- **Eager Loading**: Prevent N+1 queries
- **Indexes**: Strategic indexes on foreign keys and query columns
- **Query Optimization**: Repository pattern for complex queries
- **Soft Deletes**: Maintain data integrity without hard deletes

### Query Examples
```php
// Good - Eager loading
Application::with(['adUnits.adNetwork', 'apiKeys'])->get();

// Good - Specific columns
Application::select('id', 'name', 'package_name')->get();

// Good - Chunking large results
Application::chunk(100, function ($apps) {
    // Process
});
```

## Scalability Architecture

### Horizontal Scaling
```
                    ┌─────────────┐
                    │ Load        │
                    │ Balancer    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Web Server 1 │  │ Web Server 2 │  │ Web Server N │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       └────────────┬────┴─────────────────┘
                    ▼
            ┌───────────────┐
            │ Redis Cluster │
            └───────┬───────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  MySQL Master       │
         └──────────┬──────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│  MySQL Replica  │   │  MySQL Replica  │
└─────────────────┘   └─────────────────┘
```

### Capacity Planning

#### For 500 Applications
- **Database**: 4GB RAM, SSD storage
- **Web Servers**: 2GB RAM each, 2+ instances
- **Redis**: 512MB RAM
- **Queue Workers**: 4 workers minimum

#### For 1000+ Applications
- **Database**: 8GB+ RAM, replicated
- **Web Servers**: 4GB RAM each, 4+ instances
- **Redis**: 1GB+ RAM, clustered
- **Queue Workers**: 8+ workers across servers

## API Architecture

### Endpoint Structure
```
/api/
  └─ health                    [GET]  Public health check
  └─ v1/
      ├─ config/{package}      [GET]  Get app config (auth required)
      └─ config                [GET]  Get config via API key
```

### API Response Format
```json
{
  "success": true,
  "data": {
    "package_name": "com.example.app",
    "ads_enabled": true,
    "ads": {
      "banner": {
        "enabled": true,
        "ad_unit_id": "ca-app-pub-xxx",
        "frequency": 1,
        "refresh_interval": 60
      }
    }
  },
  "message": null,
  "errors": null
}
```

### Rate Limiting
- **Default**: 1000 requests/hour per API key
- **Configurable**: Per API key
- **Response**: 429 Too Many Requests when exceeded

## Monitoring & Observability

### Logging Strategy
```
Application Logs (storage/logs/laravel.log)
    ├─ Errors & Exceptions
    ├─ Security Events
    └─ System Events

API Logs (api_logs table)
    ├─ Request/Response
    ├─ Response Times
    ├─ IP Addresses
    └─ Error Messages

Audit Logs (audit_logs table)
    ├─ All CRUD Operations
    ├─ User Context
    ├─ Old/New Values
    └─ Timestamps
```

### Metrics to Monitor
- API response time (target: <100ms p95)
- Database query time (target: <50ms p95)
- Cache hit rate (target: >90%)
- API error rate (target: <1%)
- Queue processing time
- Disk space usage
- Memory usage

## Development Standards

### Code Organization
```
Following SOLID Principles:
S - Single Responsibility
O - Open/Closed
L - Liskov Substitution
I - Interface Segregation
D - Dependency Inversion
```

### Design Patterns Used
1. **Repository Pattern**: Data access abstraction
2. **Service Pattern**: Business logic encapsulation
3. **DTO Pattern**: Type-safe data transfer
4. **Factory Pattern**: Object creation
5. **Observer Pattern**: Event system
6. **Strategy Pattern**: Flexible algorithms
7. **Decorator Pattern**: Middleware

### Testing Strategy (To Be Implemented)
```
Unit Tests
    └─ Services, Repositories, Models

Feature Tests
    └─ API Endpoints, Admin Controllers

Integration Tests
    └─ Full workflows

Browser Tests
    └─ UI interactions (Laravel Dusk)
```

## Deployment Strategy

### Environments
1. **Development**: Local with debug enabled
2. **Staging**: Mirror of production
3. **Production**: Optimized and cached

### CI/CD Pipeline (Suggested)
```
Code Push → GitHub
    ↓
Run Tests (PHPUnit, Pint, PHPStan)
    ↓
Build Assets (npm run build)
    ↓
Deploy to Staging
    ↓
Manual Approval
    ↓
Deploy to Production
    ↓
Health Check
    ↓
Rollback if Failed
```

## Maintenance Tasks

### Daily
- ✅ Monitor error logs
- ✅ Check API health
- ✅ Review audit logs

### Weekly
- ✅ Database backup verification
- ✅ Performance review
- ✅ Security updates check

### Monthly
- ✅ Clean old logs
- ✅ Database optimization
- ✅ Security audit
- ✅ Dependency updates

## Future Enhancements

### Phase 2 (Suggested)
- [ ] Real-time dashboard updates (WebSockets)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] GraphQL API
- [ ] Machine learning for ad optimization
- [ ] Mobile SDK for easier integration
- [ ] Webhook system for real-time notifications

### Phase 3 (Suggested)
- [ ] Multi-tenancy support
- [ ] White-label solutions
- [ ] Advanced A/B testing
- [ ] Revenue reporting
- [ ] Integration with ad networks (direct)
- [ ] Fraud detection system

## Technical Specifications

### Technology Stack
- **Backend**: Laravel 13 (PHP 8.4+)
- **Frontend**: React 19 + Inertia.js 3
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn UI
- **Database**: MySQL 8+
- **Cache**: Redis 7+
- **Queue**: Redis/Database
- **Build Tool**: Vite 8

### Coding Standards
- **PHP**: PSR-12, Laravel best practices
- **TypeScript**: Strict mode enabled
- **Code Style**: Laravel Pint
- **Static Analysis**: PHPStan level 8

## Conclusion

This enterprise-grade system is built with:
- ✅ **Security First**: Encryption, RBAC, audit logging
- ✅ **Scalability**: Horizontal scaling ready
- ✅ **Maintainability**: Clean architecture, design patterns
- ✅ **Performance**: Caching, optimization, indexes
- ✅ **Reliability**: Error handling, logging, monitoring

Ready to manage 500+ mobile applications in production! 🚀
