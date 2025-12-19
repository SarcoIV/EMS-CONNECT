<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Existing web admin user
        User::factory()->create([
            'name' => 'John Doe',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('password'),
            'user_role' => 'admin',
            'role' => null, // No mobile access
        ]);

        // Web regular user
        User::factory()->create([
            'name' => 'Jane User',
            'email' => 'user@gmail.com',
            'password' => bcrypt('password'),
            'user_role' => 'user',
            'role' => null, // No mobile access
        ]);

        // Mobile app responder
        User::factory()->create([
            'name' => 'Emergency Responder',
            'email' => 'responder@test.com',
            'password' => bcrypt('password123'),
            'user_role' => 'user',      // Web role (can also access web if needed)
            'role' => 'responder',      // Mobile role
        ]);

        // Mobile app community member
        User::factory()->create([
            'name' => 'Community Member',
            'email' => 'community@test.com',
            'password' => bcrypt('password123'),
            'user_role' => 'user',      // Web role
            'role' => 'community',      // Mobile role
        ]);
    }
}
