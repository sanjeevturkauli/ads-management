<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SystemInfoController extends Controller
{
    public function index(): Response
    {
        $systemInfo = [
            'app' => [
                'name' => config('app.name'),
                'env' => config('app.env'),
                'debug' => config('app.debug'),
                'url' => config('app.url'),
                'timezone' => config('app.timezone'),
                'locale' => config('app.locale'),
            ],
            'laravel' => [
                'version' => app()->version(),
                'php_version' => PHP_VERSION,
            ],
            'database' => [
                'connection' => config('database.default'),
                'database' => config('database.connections.' . config('database.default') . '.database'),
                'host' => config('database.connections.' . config('database.default') . '.host'),
                'port' => config('database.connections.' . config('database.default') . '.port'),
            ],
            'cache' => [
                'driver' => config('cache.default'),
            ],
            'queue' => [
                'driver' => config('queue.default'),
            ],
            'session' => [
                'driver' => config('session.driver'),
                'lifetime' => config('session.lifetime') . ' minutes',
            ],
            'mail' => [
                'driver' => config('mail.default'),
                'from' => config('mail.from.address'),
            ],
        ];

        // Get database size (MySQL/MariaDB)
        try {
            $dbName = config('database.connections.' . config('database.default') . '.database');
            $size = DB::select("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.TABLES 
                WHERE table_schema = ?
            ", [$dbName]);
            
            $systemInfo['database']['size'] = ($size[0]->size_mb ?? 0) . ' MB';
        } catch (\Exception $e) {
            $systemInfo['database']['size'] = 'N/A';
        }

        // Get table counts
        try {
            $tables = [
                'applications' => DB::table('applications')->count(),
                'ad_units' => DB::table('ad_units')->count(),
                'ad_networks' => DB::table('ad_networks')->count(),
                'api_keys' => DB::table('api_keys')->count(),
                'api_logs' => DB::table('api_logs')->count(),
                'audit_logs' => DB::table('audit_logs')->count(),
                'users' => DB::table('users')->count(),
                'global_settings' => DB::table('global_settings')->count(),
            ];
            
            $systemInfo['database']['tables'] = $tables;
        } catch (\Exception $e) {
            $systemInfo['database']['tables'] = [];
        }

        // Server info
        $systemInfo['server'] = [
            'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'os' => PHP_OS,
            'php_sapi' => PHP_SAPI,
            'max_execution_time' => ini_get('max_execution_time') . ' seconds',
            'memory_limit' => ini_get('memory_limit'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
        ];

        // PHP Extensions
        $requiredExtensions = [
            'openssl', 'pdo', 'mbstring', 'tokenizer', 'xml', 'ctype', 
            'json', 'bcmath', 'curl', 'fileinfo', 'gd'
        ];
        
        $systemInfo['extensions'] = [];
        foreach ($requiredExtensions as $ext) {
            $systemInfo['extensions'][$ext] = extension_loaded($ext);
        }

        return Inertia::render('Admin/SystemInfo/Index', [
            'systemInfo' => $systemInfo,
        ]);
    }
}
