<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class VerificationService
{
    /**
     * Generate a 6-digit verification code
     */
    public static function generateCode(): string
    {
        return str_pad((string) rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Store verification code in cache (expires in 15 minutes)
     */
    public static function storeCode(string $email, string $code): void
    {
        Cache::put("verification_code_{$email}", $code, now()->addMinutes(15));
        Cache::put("verification_code_expires_{$email}", now()->addMinutes(15), now()->addMinutes(15));
    }

    /**
     * Verify code for email
     */
    public static function verifyCode(string $email, string $code): bool
    {
        $storedCode = Cache::get("verification_code_{$email}");
        
        if (!$storedCode) {
            return false;
        }

        return $storedCode === $code;
    }

    /**
     * Check if code is expired
     */
    public static function isCodeExpired(string $email): bool
    {
        $expiresAt = Cache::get("verification_code_expires_{$email}");
        
        if (!$expiresAt) {
            return true;
        }

        return now()->isAfter($expiresAt);
    }

    /**
     * Delete verification code
     */
    public static function deleteCode(string $email): void
    {
        Cache::forget("verification_code_{$email}");
        Cache::forget("verification_code_expires_{$email}");
    }
}


