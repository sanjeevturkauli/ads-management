<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(Application $application): Response
    {
        $announcements = $application->announcements()
            ->with(['creator', 'updater'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Applications/Announcements/Index', [
            'application' => $application,
            'announcements' => $announcements,
        ]);
    }

    public function store(Request $request, Application $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $announcement = $application->announcements()->create([
            'message' => $request->input('message'),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'status' => $request->input('status'),
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Announcement created successfully',
            'data' => $announcement->load(['creator', 'updater']),
        ]);
    }

    public function update(Request $request, Application $application, Announcement $announcement): JsonResponse
    {
        if ($announcement->application_id !== $application->id) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement does not belong to this application',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $announcement->update([
            'message' => $request->input('message'),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'status' => $request->input('status'),
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Announcement updated successfully',
            'data' => $announcement->load(['creator', 'updater']),
        ]);
    }

    public function destroy(Application $application, Announcement $announcement): JsonResponse
    {
        if ($announcement->application_id !== $application->id) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement does not belong to this application',
            ], 403);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully',
        ]);
    }
}
