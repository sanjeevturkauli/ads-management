<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call([
            RolePermissionSeeder::class,
            AdNetworkSeeder::class,
            GlobalSettingSeeder::class,
        ]);

        // Only create default admin if no users exist
        if (User::count() === 0) {
            // Create admin user (first user)
            $admin = User::create([
                'name' => 'admin',
                'email' => 'admin@gmail.com',
                'password' => bcrypt('Test@123'),
                'email_verified_at' => now(),
            ]);

            // Assign admin role (not super-admin)
            $admin->assignRole('admin');

            $this->command->info('✓ Admin created: admin@gmail.com / Test@123');
        } else {
            $this->command->info('✓ Users already exist. Skipping default admin creation.');
        }

        $this->command->info('✓ Database seeded successfully!');
    }
}
