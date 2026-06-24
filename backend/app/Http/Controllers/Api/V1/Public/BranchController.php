<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\BranchResource;
use App\Http\Resources\ServiceResource;
use App\Models\Branch;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

class BranchController extends Controller
{
    /**
     * Get business and all its branches by slug.
     * GET /api/v1/public/business/{slug}
     */
    public function showBusiness(string $slug): JsonResponse
    {
        $business = Business::where('slug', $slug)
            ->where('subscription_status', '!=', 'suspended')
            ->firstOrFail();

        $branches = $business->branches()
            ->where('is_active', true)
            ->get();

        return response()->json([
            'data' => [
                'business' => [
                    'id'       => $business->id,
                    'name'     => $business->name,
                    'logo_url' => $business->logo_url,
                ],
                'branches' => BranchResource::collection($branches),
            ],
        ]);
    }

    /**
     * Get specific branch by business slug + branch slug.
     * GET /api/v1/public/business/{businessSlug}/branches/{branchSlug}
     */
    public function show(string $businessSlug, string $branchSlug): JsonResponse
    {
        $business = Business::where('slug', $businessSlug)
            ->where('subscription_status', '!=', 'suspended')
            ->firstOrFail();

        $branch = Branch::where('business_id', $business->id)
            ->where('slug', $branchSlug)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json([
            'data' => new BranchResource($branch),
        ]);
    }

    /**
     * Get services for a branch.
     * GET /api/v1/public/branches/{id}/services
     */
    public function services(string $id): ResourceCollection
    {
        $branch = Branch::findOrFail($id);

        $services = $branch->services()
            ->where('is_active', true)
            ->get();

        return ServiceResource::collection($services);
    }
}
