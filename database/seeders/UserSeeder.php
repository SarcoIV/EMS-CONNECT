<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Existing web admin user
        User::create([
            'name' => 'John Doe',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('password'),
            'user_role' => 'admin',
            'role' => null, // No mobile access
            'email_verified' => true,
        ]);

        // Web regular user
        User::create([
            'name' => 'Jane User',
            'email' => 'user@gmail.com',
            'password' => bcrypt('password'),
            'user_role' => 'user',
            'role' => null, // No mobile access
            'email_verified' => true,
        ]);

        // Mobile app responder
        User::create([
            'name' => 'Emergency Responder',
            'email' => 'responder@test.com',
            'password' => bcrypt('password123'),
            'user_role' => 'user',      // Web role (can also access web if needed)
            'role' => 'responder',      // Mobile role
            'email_verified' => true,
        ]);

        // Mobile app community member
        User::create([
            'name' => 'Community Member',
            'email' => 'community@test.com',
            'password' => bcrypt('password123'),
            'user_role' => 'user',      // Web role
            'role' => 'community',      // Mobile role
            'email_verified' => true,
        ]);
    }
}
