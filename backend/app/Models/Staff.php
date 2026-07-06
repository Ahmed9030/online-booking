<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Scopes\BusinessScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Staff extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'staff';

    protected $fillable = [
        'business_id',
        'branch_id',
        'user_id',
        'name',
        'photo_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        self::addGlobalScope(new BusinessScope);
    }

    /**
     * @return BelongsTo<Business, Staff>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * @return BelongsTo<Branch, Staff>
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * @return BelongsTo<User, Staff>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsToMany<Service>
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'staff_services');
    }

    /**
     * @return HasMany<Booking>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * @return HasMany<StaffWorkingHour>
     */
    public function workingHours(): HasMany
    {
        return $this->hasMany(StaffWorkingHour::class);
    }

    /**
     * @return HasOne<TelegramUser>
     */
    public function telegramUser(): HasOne
    {
        return $this->hasOne(TelegramUser::class, 'user_id', 'user_id');
    }
}
