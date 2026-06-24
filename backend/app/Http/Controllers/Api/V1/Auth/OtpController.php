<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\RateLimiter;

class OtpController extends Controller
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {}

    /**
     * Send OTP to customer's phone.
     * POST /api/v1/auth/otp/send
     *
     * Request body:
     * {
     *   "phone": "+201001111111"
     * }
     */
    public function send(SendOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');

        // Rate limit: max 3 OTP sends per phone per 10 minutes
        $key = "otp_send:{$phone}";
        if (RateLimiter::tooManyAttempts($key, 3)) {
            return response()->json([
                'message' => 'Too many OTP requests. Please try again later.',
            ], 429);
        }

        RateLimiter::hit($key, 10 * 60);

        // Generate and send OTP
        $this->otpService->sendOtp($phone);

        return response()->json([
            'message' => 'OTP sent to your phone. Valid for 5 minutes.',
        ]);
    }

    /**
     * Verify OTP and get auth token.
     * POST /api/v1/auth/otp/verify
     *
     * Request body:
     * {
     *   "phone": "+201001111111",
     *   "code": "123456"
     * }
     */
    public function verify(VerifyOtpRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');
        $code  = $request->validated('code');

        // Verify OTP
        if (!$this->otpService->verifyOtp($phone, $code)) {
            return response()->json([
                'message' => 'Invalid or expired OTP.',
            ], 422);
        }

        // Create or get customer user (for tracking bookings)
        $user = User::firstOrCreate(
            ['phone' => $phone, 'role' => 'customer'],
            [
                'name'     => 'Customer',
                'password' => bcrypt(uniqid()),
            ],
        );

        // Create token
        $token = $user->createToken('otp')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'phone' => $phone,
            ],
            'message' => 'OTP verified successfully.',
        ]);
    }
}
