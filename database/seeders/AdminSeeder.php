<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user if not exists
        User::firstOrCreate(
            ['email' => 'admin@emsconnect.com'],
            [
                'name' => 'EMS Admin',
                'first_name' => 'EMS',
                'last_name' => 'Admin',
                'username' => 'admin',
                'email' => 'admin@emsconnect.com',
                'password' => Hash::make('password'),
                'user_role' => 'admin',
                'role' => null, // No mobile access
                'email_verified' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create a test responder for mobile app testing
        User::firstOrCreate(
            ['email' => 'responder@emsconnect.com'],
            [
                'name' => 'Test Responder',
                'first_name' => 'Test',
                'last_name' => 'Responder',
                'username' => 'testresponder',
                'email' => 'responder@emsconnect.com',
                'phone_number' => '+1234567890',
                'password' => Hash::make('password'),
                'user_role' => 'user',
                'role' => 'responder', // Mobile responder access
                'email_verified' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create a test community user for mobile app testing
        User::firstOrCreate(
            ['email' => 'community@emsconnect.com'],
            [
                'name' => 'Test Community',
                'first_name' => 'Test',
                'last_name' => 'Community',
                'username' => 'testcommunity',
                'email' => 'community@emsconnect.com',
                'phone_number' => '+1234567891',
                'password' => Hash::make('password'),
                'user_role' => 'user',
                'role' => 'community', // Mobile community access
                'email_verified' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
