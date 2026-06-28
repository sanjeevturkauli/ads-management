<?php

namespace App\DataTransferObjects;

readonly class AdUnitData
{
    public function __construct(
        public string $application_id,
        public string $ad_network_id,
        public string $ad_type,
        public string $encrypted_ad_unit_id,
        public bool $is_enabled = true,
        public int $frequency = 1,
        public int $refresh_interval = 60,
        public int $priority = 1,
        public ?int $daily_cap = null,
        public ?int $hourly_cap = null,
        public ?string $description = null,
        public ?array $metadata = null,
    ) {
    }

    public function toArray(): array
    {
        return [
            'application_id' => $this->application_id,
            'ad_network_id' => $this->ad_network_id,
            'ad_type' => $this->ad_type,
            'encrypted_ad_unit_id' => $this->encrypted_ad_unit_id,
            'is_enabled' => $this->is_enabled,
            'frequency' => $this->frequency,
            'refresh_interval' => $this->refresh_interval,
            'priority' => $this->priority,
            'daily_cap' => $this->daily_cap,
            'hourly_cap' => $this->hourly_cap,
            'description' => $this->description,
            'metadata' => $this->metadata,
        ];
    }

    public static function fromRequest(array $data): self
    {
        return new self(
            application_id: $data['application_id'],
            ad_network_id: $data['ad_network_id'],
            ad_type: $data['ad_type'],
            encrypted_ad_unit_id: $data['encrypted_ad_unit_id'],
            is_enabled: $data['is_enabled'] ?? true,
            frequency: $data['frequency'] ?? 1,
            refresh_interval: $data['refresh_interval'] ?? 60,
            priority: $data['priority'] ?? 1,
            daily_cap: $data['daily_cap'] ?? null,
            hourly_cap: $data['hourly_cap'] ?? null,
            description: $data['description'] ?? null,
            metadata: $data['metadata'] ?? null,
        );
    }
}
