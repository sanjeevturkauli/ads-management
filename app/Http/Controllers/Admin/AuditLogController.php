<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\AuditLogRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function __construct(
        private readonly AuditLogRepository $auditLogRepository
    ) {
    }

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'module', 'action', 'user_id', 'date_from', 'date_to']);

        $auditLogs = $this->auditLogRepository->paginate(10, $filters);

        // Get unique modules and actions for filters
        $modules = \App\Models\AuditLog::distinct()->pluck('module')->sort()->values();
        $actions = \App\Models\AuditLog::distinct()->pluck('action')->sort()->values();

        return Inertia::render('Admin/AuditLogs/Index', [
            'auditLogs' => $auditLogs,
            'modules' => $modules,
            'actions' => $actions,
            'filters' => $filters,
        ]);
    }
}
