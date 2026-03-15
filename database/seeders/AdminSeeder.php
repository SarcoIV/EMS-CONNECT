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
                'role' => null,
                'email_verified' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
