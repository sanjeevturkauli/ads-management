<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdUnit;
use App\Models\ApiKey;
use App\Models\ApiLog;
use App\Models\Application;
use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(): Response
    {
        // Overview Statistics
        $statistics = [
            'total_applications' => Application::count(),
            'active_applications' => Application::where('status', 'active')->count(),
            'total_ad_units' => AdUnit::count(),
            'enabled_ad_units' => AdUnit::where('is_enabled', true)->count(),
            'total_api_keys' => ApiKey::count(),
            'active_api_keys' => ApiKey::where('status', 'active')->count(),
            'total_api_requests' => ApiLog::count(),
            'total_audit_logs' => AuditLog::count(),
        ];

        // Application Status Distribution
        $applicationsByStatus = Application::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Applications by Platform
        $applicationsByPlatform = Application::select('platform', DB::raw('count(*) as count'))
            ->groupBy('platform')
            ->get()
            ->pluck('count', 'platform')
            ->toArray();

        // Ad Units by Type
        $adUnitsByType = AdUnit::select('ad_type', DB::raw('count(*) as count'))
            ->groupBy('ad_type')
            ->get()
            ->pluck('count', 'ad_type')
            ->toArray();

        // Ad Units by Network
        $adUnitsByNetwork = AdUnit::select('ad_network_id', DB::raw('count(*) as count'))
            ->with('adNetwork:id,name')
            ->groupBy('ad_network_id')
            ->get()
            ->mapWithKeys(fn($item) => [$item->adNetwork->name ?? 'Unknown' => $item->count])
            ->toArray();

        // Recent Activity (Last 7 days)
        $recentActivity = AuditLog::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count')
        )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(fn($item) => [$item->date => $item->count])
            ->toArray();

        // API Usage (Last 7 days)
        $apiUsage = ApiLog::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count')
        )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(fn($item) => [$item->date => $item->count])
            ->toArray();

        // Top Applications by Ad Units
        $topApplications = Application::select('id', 'name')
            ->withCount('adUnits')
            ->orderBy('ad_units_count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($app) => [
                'name' => $app->name,
                'ad_units_count' => $app->ad_units_count,
            ])
            ->toArray();

        // Recent Audit Logs (Last 10)
        $recentAuditLogs = AuditLog::with('user:id,name')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($log) => [
                'action' => $log->action,
                'module' => $log->module,
                'user' => $log->user?->name ?? 'System',
                'created_at' => $log->created_at->diffForHumans(),
            ])
            ->toArray();

        return Inertia::render('Admin/Analytics/Index', [
            'statistics' => $statistics,
            'applicationsByStatus' => $applicationsByStatus,
            'applicationsByPlatform' => $applicationsByPlatform,
            'adUnitsByType' => $adUnitsByType,
            'adUnitsByNetwork' => $adUnitsByNetwork,
            'recentActivity' => $recentActivity,
            'apiUsage' => $apiUsage,
            'topApplications' => $topApplications,
            'recentAuditLogs' => $recentAuditLogs,
        ]);
    }
}
