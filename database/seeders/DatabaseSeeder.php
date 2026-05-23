<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $roles = ['admin', 'operator', 'viewer'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $admin = User::firstOrCreate(
            ['email' => 'admin@poltekpar-palembang.ac.id'],
            [
                'name' => 'Admin',
                'password' => bcrypt('admin123'),
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole('admin');
    }
}
