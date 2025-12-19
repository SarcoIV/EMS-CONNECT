<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class LiveMapController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('Admin/LiveMap', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}

