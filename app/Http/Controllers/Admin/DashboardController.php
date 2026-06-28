<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApiLog;
use App\Models\Application;
use App\Services\ApplicationService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ApplicationService $applicationService
    ) {
    }

    public function index(): Response
    {
        $statistics = $this->applicationService->getStatistics();

        // API statistics
        $apiStats = [
            'today' => ApiLog::whereDate('created_at', today())->count(),
            'total' => ApiLog::count(),
            'successful' => ApiLog::successful()->count(),
            'failed' => ApiLog::failed()->count(),
        ];

        // Recent applications
        $recentApplications = Application::with('creator')
            ->latest()
            ->take(5)
            ->get();

        // API usage chart data (last 7 days)
        $apiUsageChart = ApiLog::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total'),
            DB::raw('SUM(CASE WHEN response_code >= 200 AND response_code < 300 THEN 1 ELSE 0 END) as successful'),
            DB::raw('SUM(CASE WHEN response_code >= 400 THEN 1 ELSE 0 END) as failed')
        )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top applications by API calls
        $topApplications = Application::select('applications.*')
            ->withCount('apiLogs')
            ->orderByDesc('api_logs_count')
            ->take(10)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'statistics' => $statistics,
            'apiStats' => $apiStats,
            'recentApplications' => $recentApplications,
            'apiUsageChart' => $apiUsageChart,
            'topApplications' => $topApplications,
        ]);
    }
}
