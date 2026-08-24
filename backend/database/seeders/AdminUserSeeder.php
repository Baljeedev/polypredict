<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->firstOrNew(['email' => 'admin@polypredict.com']);
        $user->name = 'Admin';
        $user->password = 'password123';
        $user->is_admin = true;

        if (! $user->username) {
            $username = 'admin';
            $i = 1;
            while (User::query()->where('username', $username)->exists()) {
                $username = 'admin'.$i;
                $i++;
            }
            $user->username = $username;
        }

        $user->save();

        if (! $user->wallet()->exists()) {
            $user->wallet()->create([
                'available' => 1000,
                'committed' => 0,
                'ad_tokens' => 0,
            ]);
        }
    }
}
