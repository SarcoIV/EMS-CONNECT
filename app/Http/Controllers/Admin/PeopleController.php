<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PeopleController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $drivers = Driver::orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/People', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'drivers' => $drivers,
        ]);
    }
}
