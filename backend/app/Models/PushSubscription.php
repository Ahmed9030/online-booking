<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PushSubscription extends Model
{
    use HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'subscription',
        'user_agent',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subscription' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, PushSubscription>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
