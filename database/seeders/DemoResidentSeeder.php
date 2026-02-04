<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Incident;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoResidentSeeder extends Seeder
{
    /**
     * Seed a demo resident account with complete details and sample incident for mobile app showcasing.
     *
     * This seeder creates:
     * 1. A verified community resident with complete medical profile
     * 2. A sample medical emergency incident created by the resident
     */
    public function run(): void
    {
        // Create demo resident account
        $resident = User::create([
            // Basic account info
            'name' => 'Maria Santos',
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'username' => 'maria.santos',
            'email' => 'maria.santos@example.com',
            'phone_number' => '+639171234567',
            'password' => Hash::make('password123'), 

            // Mobile app role
            'role' => 'community', // Mobile app role (not responder)
            'user_role' => 'user', // Web app role

            // Verification status
            'email_verified' => true,
            'email_verified_at' => now(),

            // Medical profile (important for community residents)
            'blood_type' => 'O+',
            'allergies' => 'Penicillin, Peanuts',
            'existing_conditions' => 'Hypertension, Type 2 Diabetes',
            'medications' => 'Metformin 500mg (2x daily), Losartan 50mg (1x daily)',

            // Home location (Quezon City, Metro Manila)
            'base_latitude' => 14.6760,
            'base_longitude' => 121.0437,
            'base_address' => '123 Commonwealth Avenue, Barangay Holy Spirit, Quezon City, Metro Manila, Philippines',

            // Current location (same as home for now)
            'current_latitude' => 14.6760,
            'current_longitude' => 121.0437,
            'location_updated_at' => now(),

            // Timestamps
            'last_login_at' => now()->subHours(2),
            'created_at' => now()->subMonths(3),
            'updated_at' => now()->subHours(2),
        ]);

        // Create sample incident reported by this resident
        Incident::create([
            'user_id' => $resident->id,
            'type' => 'medical', // Medical emergency
            'status' => 'pending', // Ready to be dispatched

            // Incident location (slightly different from home - emergency at nearby location)
            'latitude' => 14.6785,
            'longitude' => 121.0450,
            'address' => 'SM North EDSA, North Avenue, Quezon City, Metro Manila, Philippines',

            // Incident details
            'description' => 'Elderly person collapsed near the food court area. Patient is conscious but experiencing chest pain and difficulty breathing. Bystanders are providing assistance.',

            // Dispatch fields (null for pending incident)
            'assigned_unit' => null,
            'assigned_admin_id' => null,
            'dispatched_at' => null,
            'completed_at' => null,

            // Timestamps
            'created_at' => now()->subMinutes(15), // Incident reported 15 minutes ago
            'updated_at' => now()->subMinutes(15),
        ]);

        $this->command->info('✓ Demo resident account created:');
        $this->command->info('  Email: maria.santos@example.com');
        $this->command->info('  Password: password123');
        $this->command->info('  Role: community (resident)');
        $this->command->info('  Location: Quezon City, Metro Manila');
        $this->command->info('');
        $this->command->info('✓ Sample medical incident created:');
        $this->command->info('  Type: Medical Emergency');
        $this->command->info('  Location: SM North EDSA');
        $this->command->info('  Status: Pending (ready for dispatch)');
    }
}
