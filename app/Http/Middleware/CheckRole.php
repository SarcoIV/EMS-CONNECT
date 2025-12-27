<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  string  $role  The required role (e.g., 'admin', 'user')
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // Check if user is authenticated
        if (! Auth::check()) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthorized. Authentication required.',
                ], 401);
            }

            return redirect()->route('auth.login')
                ->with('error', 'Please login to access this page');
        }

        $user = Auth::user();

        // Check if user has the required role
        $hasRole = match ($role) {
            'admin' => $user->user_role === 'admin',
            'user' => $user->user_role === 'user',
            default => false,
        };

        if (! $hasRole) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => "Unauthorized. {$role} access required.",
                ], 403);
            }

            return redirect()->route('home')
                ->with('error', "Access denied. {$role} privileges required");
        }

        return $next($request);
    }
}
