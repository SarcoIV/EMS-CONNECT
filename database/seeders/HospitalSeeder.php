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
                'latitude' => 14.6611599,
                'longitude' => 121.0182090,
                'phone_number' => '(02) 8921-0595',
                'specialties' => ['Emergency Medicine', 'Internal Medicine', 'Surgery', 'Pediatrics', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'East Avenue Medical Center',
                'type' => 'government',
                'address' => 'East Avenue, Diliman, Quezon City, 1101 Metro Manila',
                'latitude' => 14.6421432,
                'longitude' => 121.0479837,
                'phone_number' => '(02) 8928-0611',
                'specialties' => ['Trauma Care', 'Neurosurgery', 'Cardiology', 'Oncology', 'Emergency Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Veterans Memorial Medical Center',
                'type' => 'government',
                'address' => 'North Avenue, Diliman, Quezon City, 1104 Metro Manila',
                'latitude' => 14.6561184,
                'longitude' => 121.0400556,
                'phone_number' => '(02) 8927-0001',
                'specialties' => ['Emergency Medicine', 'Orthopedics', 'Neurology', 'Surgery', 'Internal Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'National Kidney and Transplant Institute',
                'type' => 'government',
                'address' => 'East Avenue, Diliman, Quezon City, 1101 Metro Manila',
                'latitude' => 14.6473447,
                'longitude' => 121.0473288,
                'phone_number' => '(02) 8981-0300',
                'specialties' => ['Nephrology', 'Transplant Surgery', 'Dialysis', 'Urology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Philippine Heart Center',
                'type' => 'government',
                'address' => 'East Avenue, Quezon City, 1100 Metro Manila',
                'latitude' => 14.6441499,
                'longitude' => 121.0481468,
                'phone_number' => '(02) 8925-2401',
                'specialties' => ['Cardiology', 'Cardiovascular Surgery', 'Interventional Cardiology', 'Pediatric Cardiology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Lung Center of the Philippines',
                'type' => 'government',
                'address' => 'Quezon Avenue, Quezon City, 1104 Metro Manila',
                'latitude' => 14.6477279,
                'longitude' => 121.0452136,
                'phone_number' => '(02) 8924-6101',
                'specialties' => ['Pulmonology', 'Thoracic Surgery', 'Respiratory Medicine', 'Critical Care'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'National Children\'s Hospital',
                'type' => 'government',
                'address' => 'E. Rodriguez Sr. Avenue, Quezon City, Metro Manila',
                'latitude' => 14.6204405,
                'longitude' => 121.0208118,
                'phone_number' => '(02) 8924-6601',
                'specialties' => ['Pediatric Surgery', 'Neonatology', 'Pediatric Cardiology', 'Pediatric Oncology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],

            // Private Hospitals
            [
                'name' => 'St. Luke\'s Medical Center QC',
                'type' => 'private',
                'address' => '279 E. Rodriguez Sr. Avenue, Quezon City, 1102 Metro Manila',
                'latitude' => 14.6225328,
                'longitude' => 121.0232452,
                'phone_number' => '(02) 8723-0301',
                'specialties' => ['Cancer Center', 'Heart Institute', 'Neurosciences', 'Transplant', 'Emergency Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Capitol Medical Center',
                'type' => 'private',
                'address' => 'Scout Madriñan corner A. Roces Avenue, Quezon City, 1103 Metro Manila',
                'latitude' => 14.6342467,
                'longitude' => 121.0228414,
                'phone_number' => '(02) 8375-8888',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'Cardiology', 'Neurology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Diliman Doctors Hospital',
                'type' => 'private',
                'address' => 'Diliman, Quezon City, Metro Manila',
                'latitude' => 14.6684299,
                'longitude' => 121.0761498,
                'phone_number' => '(02) 8921-3176',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'New Era General Hospital',
                'type' => 'private',
                'address' => 'New Era, Quezon City, Metro Manila',
                'latitude' => 14.6641226,
                'longitude' => 121.0667406,
                'phone_number' => '(02) 8981-1900',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'Pediatrics'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'General Malvar Hospital',
                'type' => 'private',
                'address' => 'Quezon City, Metro Manila',
                'latitude' => 14.6670000,
                'longitude' => 121.0726780,
                'phone_number' => '(02) 8920-1234',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Metro North Medical Center',
                'type' => 'private',
                'address' => 'Quirino Highway, Novaliches, Quezon City, Metro Manila',
                'latitude' => 14.6688420,
                'longitude' => 121.0335790,
                'phone_number' => '(02) 8936-6789',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Dialysis', 'Internal Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'World Citi Medical Center',
                'type' => 'private',
                'address' => '960 Aurora Boulevard corner E. Rodriguez Sr. Avenue, Quezon City, 1109 Metro Manila',
                'latitude' => 14.6272442,
                'longitude' => 121.0633398,
                'phone_number' => '(02) 8372-0563',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'Cardiology', 'Orthopedics'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Commonwealth Hospital and Medical Center',
                'type' => 'private',
                'address' => 'Commonwealth Avenue, Quezon City, 1121 Metro Manila',
                'latitude' => 14.7314934,
                'longitude' => 121.0608504,
                'phone_number' => '(02) 8951-7777',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
        ];

        // Remove hospitals that are no longer in the approved list
        $hospitalNames = array_column($hospitals, 'name');
        Hospital::whereNotIn('name', $hospitalNames)->delete();

        foreach ($hospitals as $hospital) {
            Hospital::updateOrCreate(
                ['name' => $hospital['name']],
                $hospital
            );
        }
    }
}
