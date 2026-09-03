<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|min:3|max:30|unique:users|alpha_dash',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create($data);
        $user->wallet()->create([
            'available' => 1000,
            'committed' => 0,
            'ad_tokens' => 0,
        ]);

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function googleRedirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function googleCallback()
    {
        try {
            $google = Socialite::driver('google')->stateless()->user();

            $user = User::query()->where('email', $google->getEmail())->first();

            if (! $user) {
                $base = substr(preg_replace('/[^A-Za-z0-9_]/', '', explode('@', (string) $google->getEmail())[0]), 0, 20);
                if ($base === '') {
                    $base = 'user';
                }
                $username = $base;
                $i = 0;
                while (User::query()->where('username', $username)->exists()) {
                    $i++;
                    $username = $base.$i;
                }

                $user = User::create([
                    'name' => $google->getName() ?: $username,
                    'username' => $username,
                    'email' => $google->getEmail(),
                    'password' => Hash::make(Str::random(32)),
                ]);
                $user->wallet()->create([
                    'available' => 1000,
                    'committed' => 0,
                    'ad_tokens' => 0,
                ]);
            }

            $token = $user->createToken('auth')->plainTextToken;
            $front = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');

            return redirect($front.'/auth/google/callback/?token='.urlencode($token));
        } catch (\Throwable $e) {
            $front = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');

            return redirect($front.'/user/login/?google_error='.urlencode($e->getMessage()));
        }
    }
}