<?php

namespace Database\Seeders;

use App\Models\Hospital;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $hospitals = [
            // Government Hospitals
            [
                'name' => 'Quezon City General Hospital',
                'type' => 'government',
                'address' => 'Seminary Rd, Bahay Toro, Project 8, Quezon City, 1106 Metro Manila',
                'latitude' => 14.6396,
                'longitude' => 121.0397,
                'phone_number' => '(02) 8921-0595',
                'specialties' => ['Emergency Medicine', 'Internal Medicine', 'Surgery', 'Pediatrics', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'East Avenue Medical Center',
                'type' => 'government',
                'address' => 'East Avenue, Diliman, Quezon City, 1101 Metro Manila',
                'latitude' => 14.6195,
                'longitude' => 121.0422,
                'phone_number' => '(02) 8928-0611',
                'specialties' => ['Trauma Care', 'Neurosurgery', 'Cardiology', 'Oncology', 'Emergency Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Philippine Children\'s Medical Center',
                'type' => 'government',
                'address' => 'Quezon Avenue, Quezon City, 1101 Metro Manila',
                'latitude' => 14.6382,
                'longitude' => 121.0408,
                'phone_number' => '(02) 8924-6601',
                'specialties' => ['Pediatric Surgery', 'Neonatology', 'Pediatric Cardiology', 'Pediatric Oncology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Quirino Memorial Medical Center',
                'type' => 'government',
                'address' => 'Quirino Highway, Novaliches, Quezon City, 1116 Metro Manila',
                'latitude' => 14.6783,
                'longitude' => 121.0361,
                'phone_number' => '(02) 8936-0011',
                'specialties' => ['Emergency Medicine', 'Surgery', 'OB-GYN', 'Internal Medicine', 'Orthopedics'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Philippine Heart Center',
                'type' => 'government',
                'address' => 'East Avenue, Quezon City, 1100 Metro Manila',
                'latitude' => 14.6396,
                'longitude' => 121.0378,
                'phone_number' => '(02) 8925-2401',
                'specialties' => ['Cardiology', 'Cardiovascular Surgery', 'Interventional Cardiology', 'Pediatric Cardiology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Lung Center of the Philippines',
                'type' => 'government',
                'address' => 'Quezon Avenue, Quezon City, 1104 Metro Manila',
                'latitude' => 14.6408,
                'longitude' => 121.0370,
                'phone_number' => '(02) 8924-6101',
                'specialties' => ['Pulmonology', 'Thoracic Surgery', 'Respiratory Medicine', 'Critical Care'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Veterans Memorial Medical Center',
                'type' => 'government',
                'address' => 'North Avenue, Diliman, Quezon City, 1104 Metro Manila',
                'latitude' => 14.6375,
                'longitude' => 121.0353,
                'phone_number' => '(02) 8927-0001',
                'specialties' => ['Emergency Medicine', 'Orthopedics', 'Neurology', 'Surgery', 'Internal Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'National Kidney and Transplant Institute',
                'type' => 'government',
                'address' => 'East Avenue, Diliman, Quezon City, 1101 Metro Manila',
                'latitude' => 14.6402,
                'longitude' => 121.0385,
                'phone_number' => '(02) 8981-0300',
                'specialties' => ['Nephrology', 'Transplant Surgery', 'Dialysis', 'Urology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],

            // Private Hospitals
            [
                'name' => 'St. Luke\'s Medical Center - Quezon City',
                'type' => 'private',
                'address' => '279 E. Rodriguez Sr. Avenue, Quezon City, 1102 Metro Manila',
                'latitude' => 14.6231,
                'longitude' => 121.0386,
                'phone_number' => '(02) 8723-0301',
                'specialties' => ['Cancer Center', 'Heart Institute', 'Neurosciences', 'Transplant', 'Emergency Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Fe Del Mundo Medical Center',
                'type' => 'private',
                'address' => '11 Banawe Street, Quezon City, 1114 Metro Manila',
                'latitude' => 14.6242,
                'longitude' => 121.0394,
                'phone_number' => '(02) 8712-6102',
                'specialties' => ['Pediatrics', 'Neonatology', 'OB-GYN', 'Pediatric Surgery'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'World Citi Medical Center',
                'type' => 'private',
                'address' => '960 Aurora Boulevard corner E. Rodriguez Sr. Avenue, Quezon City, 1109 Metro Manila',
                'latitude' => 14.6289,
                'longitude' => 121.0422,
                'phone_number' => '(02) 8372-0563',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'Cardiology', 'Orthopedics'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Commonwealth Hospital and Medical Center',
                'type' => 'private',
                'address' => 'Commonwealth Avenue, Quezon City, 1121 Metro Manila',
                'latitude' => 14.6856,
                'longitude' => 121.0889,
                'phone_number' => '(02) 8951-7777',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Capitol Medical Center',
                'type' => 'private',
                'address' => 'Scout Madriñan corner A. Roces Avenue, Quezon City, 1103 Metro Manila',
                'latitude' => 14.6175,
                'longitude' => 121.0318,
                'phone_number' => '(02) 8375-8888',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'Cardiology', 'Neurology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Mary Chiles General Hospital',
                'type' => 'private',
                'address' => 'Quirino Highway, Quezon City, Metro Manila',
                'latitude' => 14.6789,
                'longitude' => 121.0547,
                'phone_number' => '(02) 8806-5555',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Metro North Medical Center and Hospital',
                'type' => 'private',
                'address' => 'Quirino Highway, Novaliches, Quezon City, Metro Manila',
                'latitude' => 14.6892,
                'longitude' => 121.0356,
                'phone_number' => '(02) 8936-6789',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Dialysis', 'Internal Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'De Jesus-Duran Medical Center',
                'type' => 'private',
                'address' => 'Araneta Avenue, Quezon City, Metro Manila',
                'latitude' => 14.6156,
                'longitude' => 121.0203,
                'phone_number' => '(02) 8711-6271',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'Pediatrics'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
        ];

        foreach ($hospitals as $hospital) {
            Hospital::updateOrCreate(
                ['name' => $hospital['name']],
                $hospital
            );
        }
    }
}
