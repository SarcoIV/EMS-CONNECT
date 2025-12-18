<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class UserEditController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('Admin/UserEdit', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}
