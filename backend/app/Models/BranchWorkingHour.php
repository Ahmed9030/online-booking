<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Scopes\BusinessScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class BranchWorkingHour extends Model
{
    use HasUuids;

    protected static function booted(): void
    {
        self::addGlobalScope(new BusinessScope);
    }

    protected $fillable = [
        'branch_id',
        'weekday',
        'open_time',
        'close_time',
    ];

    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
