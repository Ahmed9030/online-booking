<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Scopes\BusinessScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

final class Customer extends Model
{
    use HasApiTokens, HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
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

    /**
     * @return BelongsTo<User, Customer>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Business, Customer>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * @return HasMany<Booking>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
