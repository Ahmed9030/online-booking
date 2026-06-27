<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\OtpCode;
use Illuminate\Support\Facades\Log;

class OtpService
{
    /**
     * Generate and store a new OTP for the given phone number.
     * In production this would dispatch a WhatsApp/SMS message via n8n.
     */
    public function sendOtp(string $phone): void
    {
        // Invalidate any existing unused OTPs for this phone
        OtpCode::where('phone', $phone)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->delete();

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpCode::create([
            'phone'      => $phone,
            'code'       => $code,
            'expires_at' => now()->addMinutes(5),
        ]);

        // TODO: dispatch SendOtpViaWhatsAppJob when n8n integration is ready
        Log::info("OTP for {$phone}: {$code}");
    }

    /**
     * Verify an OTP code for a given phone number.
     * Marks the OTP as consumed on success.
     */
    public function verifyOtp(string $phone, string $code): bool
    {
        $otp = OtpCode::where('phone', $phone)
            ->where('code', $code)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            return false;
        }

        $otp->update(['consumed_at' => now()]);

        return true;
    }
}
