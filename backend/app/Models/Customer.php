<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Scopes\BusinessScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

final class Customer extends Model
{
    use HasApiTokens, HasUuids;

    protected $fillable = [
        'business_id',
        'phone',
        'name',
        'otp_verified_at',
        'visit_count',
        'last_visit_at',
    ];

    protected function casts(): array
    {
        return [
            'otp_verified_at' => 'datetime',
            'visit_count' => 'integer',
            'last_visit_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        self::addGlobalScope(new BusinessScope);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
