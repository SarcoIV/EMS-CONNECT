<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HospitalDirectoryController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $hospitals = Hospital::active()
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(function ($hospital) {
                return [
                    'id' => $hospital->id,
                    'name' => $hospital->name,
                    'type' => $hospital->type,
                    'address' => $hospital->address,
                    'latitude' => $hospital->latitude,
                    'longitude' => $hospital->longitude,
                    'phone_number' => $hospital->phone_number,
                    'specialties' => $hospital->specialties,
                    'image_url' => $hospital->full_image_url,
                    'has_emergency_room' => $hospital->has_emergency_room,
                    'description' => $hospital->description,
                    'website' => $hospital->website,
                    'bed_capacity' => $hospital->bed_capacity,
                ];
            });

        return Inertia::render('Admin/HospitalDirectory', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'hospitals' => $hospitals,
        ]);
    }
}
