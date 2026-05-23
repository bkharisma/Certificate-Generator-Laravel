<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

#[Fillable(['key', 'value'])]
class Setting extends Model
{
    use HasFactory;

    public static function get(string $key, $default = null): ?string
    {
        return Cache::remember("setting_{$key}", 60, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    public static function set(string $key, string $value): static
    {
        Cache::forget("setting_{$key}");
        return static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
