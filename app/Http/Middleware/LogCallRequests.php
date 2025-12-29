<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogCallRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log incoming request for call-related endpoints
        if ($request->is('admin/calls/*') || $request->is('api/call/*')) {
            Log::info('[CALL_REQUEST] Incoming request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'path' => $request->path(),
                'user_id' => $request->user()?->id,
                'user_role' => $request->user()?->user_role,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'payload' => $request->except(['password', 'token']),
                'timestamp' => now()->toIso8601String(),
            ]);
        }

        $response = $next($request);

        // Log response for call-related endpoints
        if ($request->is('admin/calls/*') || $request->is('api/call/*')) {
            Log::info('[CALL_RESPONSE] Response sent', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'status' => $response->status(),
                'user_id' => $request->user()?->id,
                'timestamp' => now()->toIso8601String(),
            ]);
        }

        return $response;
    }
}
