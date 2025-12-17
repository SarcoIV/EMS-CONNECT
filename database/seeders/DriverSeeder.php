<?php

namespace Database\Seeders;

use App\Models\Driver;
use Illuminate\Database\Seeder;

class DriverSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $drivers = [
            [
                'driver_id' => 'SBR123456',
                'name' => 'Mr.Jones',
                'phone' => '+13324567890',
                'email' => 'jones@gmail.com',
            ],
            [
                'driver_id' => 'SBR123457',
                'name' => 'Mr.Smith',
                'phone' => '+13324567891',
                'email' => 'smith@gmail.com',
            ],
            [
                'driver_id' => 'SBR123458',
                'name' => 'Ms.Williams',
                'phone' => '+13324567892',
                'email' => 'williams@gmail.com',
            ],
        ];

        foreach ($drivers as $driver) {
            Driver::create($driver);
        }
    }
}
