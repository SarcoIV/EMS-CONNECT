<?php

namespace App\Services;

/**
 * Agora RTC Token Generation Service
 *
 * Generates authentication tokens for Agora RTC channels.
 * Based on Agora's RTC Token Builder v2 algorithm.
 */
class AgoraService
{
    private string $appId;
    private string $appCertificate;

    public function __construct()
    {
        $this->appId = config('services.agora.app_id');
        $this->appCertificate = config('services.agora.app_certificate');

        if (empty($this->appCertificate)) {
            throw new \Exception('AGORA_APP_CERTIFICATE is not configured in .env file');
        }
    }

    /**
     * Generate an RTC token for a channel
     *
     * @param string $channelName The channel name
     * @param int $uid User ID (0 for any user)
     * @param int $expirationTimeInSeconds Token expiration time (default: 24 hours)
     * @return string The generated token
     */
    public function generateRtcToken(
        string $channelName,
        int $uid = 0,
        int $expirationTimeInSeconds = 86400
    ): string {
        $currentTimestamp = time();
        $privilegeExpiredTs = $currentTimestamp + $expirationTimeInSeconds;

        return $this->buildToken($channelName, $uid, $privilegeExpiredTs);
    }

    /**
     * Build the RTC token using Agora's algorithm
     */
    private function buildToken(string $channelName, int $uid, int $privilegeExpiredTs): string
    {
        $version = '007';
        $randomInt = rand();
        $salt = $randomInt;

        // Build message
        $message = $this->packString($this->appId)
            . $this->packString($channelName)
            . $this->packUint32($salt)
            . $this->packUint32($privilegeExpiredTs)
            . $this->packUint32($privilegeExpiredTs)
            . $this->packUint32($uid)
            . $this->packUint32($privilegeExpiredTs);

        // Generate signature
        $signature = hash_hmac('sha256', $message, $this->appCertificate, true);

        // Build token content
        $content = $this->packString($signature)
            . $this->packString($this->appId)
            . $this->packString($channelName)
            . $this->packUint32($salt)
            . $this->packUint32($privilegeExpiredTs)
            . $this->packUint32($privilegeExpiredTs)
            . $this->packUint32($uid)
            . $this->packUint32($privilegeExpiredTs);

        return $version . base64_encode($content);
    }

    /**
     * Pack string with length prefix
     */
    private function packString(string $value): string
    {
        return pack('v', strlen($value)) . $value;
    }

    /**
     * Pack unsigned 32-bit integer (little-endian)
     */
    private function packUint32(int $value): string
    {
        return pack('V', $value);
    }

    /**
     * Get the Agora App ID
     */
    public function getAppId(): string
    {
        return $this->appId;
    }
}
