<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HospitalDirectoryController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('Admin/HospitalDirectory', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}
