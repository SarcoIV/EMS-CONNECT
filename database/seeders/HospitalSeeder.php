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
                'latitude' => 14.661375887737105,
                'longitude' => 121.0184174152855,
                'phone_number' => '(02) 8921-0595',
                'specialties' => ['Emergency Medicine', 'Internal Medicine', 'Surgery', 'Pediatrics', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'East Avenue Medical Center',
                'type' => 'government',
                'address' => 'East Avenue, Diliman, Quezon City, 1101 Metro Manila',
                'latitude' => 14.64229889180646,
                'longitude' => 121.04800515311909,
                'phone_number' => '(02) 8928-0611',
                'specialties' => ['Trauma Care', 'Neurosurgery', 'Cardiology', 'Oncology', 'Emergency Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Veterans Memorial Medical Center',
                'type' => 'government',
                'address' => 'North Avenue, Diliman, Quezon City, 1104 Metro Manila',
                'latitude' => 14.656242999373438,
                'longitude' => 121.04043207076761,
                'phone_number' => '(02) 8927-0001',
                'specialties' => ['Emergency Medicine', 'Orthopedics', 'Neurology', 'Surgery', 'Internal Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'National Kidney and Transplant Institute',
                'type' => 'government',
                'address' => 'East Avenue, Diliman, Quezon City, 1101 Metro Manila',
                'latitude' => 14.64746746474301,
                'longitude' => 121.04727005664265,
                'phone_number' => '(02) 8981-0300',
                'specialties' => ['Nephrology', 'Transplant Surgery', 'Dialysis', 'Urology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Philippine Heart Center',
                'type' => 'government',
                'address' => 'East Avenue, Quezon City, 1100 Metro Manila',
                'latitude' => 14.644295213508082,
                'longitude' => 121.04859813564966,
                'phone_number' => '(02) 8925-2401',
                'specialties' => ['Cardiology', 'Cardiovascular Surgery', 'Interventional Cardiology', 'Pediatric Cardiology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Lung Center of the Philippines',
                'type' => 'government',
                'address' => 'Quezon Avenue, Quezon City, 1104 Metro Manila',
                'latitude' => 14.648004443810098,
                'longitude' => 121.04631530390503,
                'phone_number' => '(02) 8924-6101',
                'specialties' => ['Pulmonology', 'Thoracic Surgery', 'Respiratory Medicine', 'Critical Care'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'National Children\'s Hospital',
                'type' => 'government',
                'address' => 'E. Rodriguez Sr. Avenue, Quezon City, Metro Manila',
                'latitude' => 14.620780729851615,
                'longitude' => 121.02036514045896,
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
                'latitude' => 14.622761174974052,
                'longitude' => 121.02388892557542,
                'phone_number' => '(02) 8723-0301',
                'specialties' => ['Cancer Center', 'Heart Institute', 'Neurosciences', 'Transplant', 'Emergency Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Capitol Medical Center',
                'type' => 'private',
                'address' => 'Scout Madriñan corner A. Roces Avenue, Quezon City, 1103 Metro Manila',
                'latitude' => 14.634395962790064,
                'longitude' => 121.02267331448625,
                'phone_number' => '(02) 8375-8888',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'Cardiology', 'Neurology'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Diliman Doctors Hospital',
                'type' => 'private',
                'address' => 'Diliman, Quezon City, Metro Manila',
                'latitude' => 14.668585573102932,
                'longitude' => 121.07681498324729,
                'phone_number' => '(02) 8921-3176',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'New Era General Hospital',
                'type' => 'private',
                'address' => 'New Era, Quezon City, Metro Manila',
                'latitude' => 14.664267896817384,
                'longitude' => 121.06671913777761,
                'phone_number' => '(02) 8981-1900',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'Pediatrics'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'General Malvar Hospital',
                'type' => 'private',
                'address' => 'Quezon City, Metro Manila',
                'latitude' => 14.66765263722275,
                'longitude' => 121.07357919207013,
                'phone_number' => '(02) 8920-1234',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'OB-GYN'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Metro North Medical Center',
                'type' => 'private',
                'address' => 'Quirino Highway, Novaliches, Quezon City, Metro Manila',
                'latitude' => 14.669121630061827,
                'longitude' => 121.03386720506062,
                'phone_number' => '(02) 8936-6789',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Dialysis', 'Internal Medicine'],
                'has_emergency_room' => true,
                'is_active' => true,
            ],
            [
                'name' => 'World Citi Medical Center',
                'type' => 'private',
                'address' => '960 Aurora Boulevard corner E. Rodriguez Sr. Avenue, Quezon City, 1109 Metro Manila',
                'latitude' => 14.627431045685706,
                'longitude' => 121.0636616605117,
                'phone_number' => '(02) 8372-0563',
                'specialties' => ['Emergency Medicine', 'Surgery', 'Internal Medicine', 'Cardiology', 'Orthopedics'],
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
