<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HospitalController extends Controller
{
    /**
     * Get nearby hospitals sorted by distance.
     *
     * GET /api/hospitals/nearby?latitude=14.5995&longitude=120.9842&radius=50
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function nearby(Request $request)
    {
        try {
            $validated = $request->validate([
                'latitude' => ['required', 'numeric', 'between:-90,90'],
                'longitude' => ['required', 'numeric', 'between:-180,180'],
                'radius' => ['nullable', 'numeric', 'min:1', 'max:200'],
            ]);

            $lat = $validated['latitude'];
            $lng = $validated['longitude'];
            $radiusKm = $validated['radius'] ?? 50;

            $hospitals = Hospital::query()
                ->select([
                    'id', 'name', 'address', 'latitude', 'longitude', 'phone_number',
                    DB::raw('(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance'),
                ])
                ->where('is_active', true)
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->having('distance', '<=', $radiusKm)
                ->orderBy('distance')
                ->limit(20)
                ->setBindings([$lat, $lng, $lat])
                ->get();

            return response()->json([
                'hospitals' => $hospitals->map(fn ($h) => [
                    'id' => $h->id,
                    'name' => $h->name,
                    'address' => $h->address,
                    'latitude' => (float) $h->latitude,
                    'longitude' => (float) $h->longitude,
                    'phone_number' => $h->phone_number,
                ]),
            ]);
        } catch (\Exception $e) {
            Log::error('[HOSPITAL] Failed to fetch nearby hospitals', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'message' => 'Failed to fetch nearby hospitals',
            ], 500);
        }
    }
}
