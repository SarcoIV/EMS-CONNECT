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
        // Web admin user
        User::create([
            'name' => 'John Doe',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('password'),
            'user_role' => 'admin',
            'role' => null,
            'email_verified' => true,
        ]);
    }
}
