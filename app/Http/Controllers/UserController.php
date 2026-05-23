<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::with('roles')
            ->latest()
            ->paginate(15);

        $roles = Role::all()->pluck('name');

        return Inertia::render('Users/Index', [
            'users' => $users,
            'availableRoles' => $roles,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', Password::defaults()],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($request->role);

        return redirect()->route('users.index')
            ->with('success', "User {$user->name} created successfully.");
    }

    public function bulkStore(Request $request): RedirectResponse
    {
        $request->validate([
            'users' => ['required', 'array', 'min:1'],
            'users.*.name' => ['required', 'string', 'max:255'],
            'users.*.email' => ['required', 'string', 'email', 'max:255', 'distinct', 'unique:users,email'],
            'users.*.password' => ['required', 'string', Password::defaults()],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $created = 0;
        foreach ($request->users as $userData) {
            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'email_verified_at' => now(),
            ]);

            $user->assignRole($request->role);
            $created++;
        }

        return redirect()->route('users.index')
            ->with('success', "{$created} users created successfully.");
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->route('users.index')
            ->with('success', "Password reset for {$user->name}.");
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->isAdmin()) {
            return redirect()->route('users.index')
                ->with('error', 'Cannot delete admin users.');
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', "User {$user->name} deleted successfully.");
    }
}
