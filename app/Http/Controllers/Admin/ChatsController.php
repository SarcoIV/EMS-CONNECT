<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ChatsController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('Admin/Chats', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}



