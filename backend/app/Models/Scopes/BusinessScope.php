<?php

declare(strict_types=1);

namespace App\Models\Scopes;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

final class BusinessScope implements Scope
{
    /**
     * @param  Builder<Model>  $builder
     */
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user === null || $user->business_id === null || $user->role === UserRole::Admin) {
            return;
        }

        $builder->where($model->getTable().'.business_id', $user->business_id);
    }
}
