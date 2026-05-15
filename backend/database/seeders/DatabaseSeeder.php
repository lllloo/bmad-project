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
        // W0 spike — 建一個固定 user 給 frontend login form 預設帶入用
        // password: password123（明文，bcrypt by User cast）
        User::updateOrCreate(
            ['email' => 'jie@example.com'],
            [
                'name' => 'Jie (spike)',
                'password' => 'password123',
            ],
        );
    }
}
