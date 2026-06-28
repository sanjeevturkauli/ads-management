<?php

namespace App\DataTransferObjects;

readonly class ApplicationData
{
    public function __construct(
        public string $name,
        public string $package_name,
        public string $platform,
        public ?string $icon_url = null,
        public ?string $description = null,
        public string $current_version = '1.0.0',
        public string $minimum_version = '1.0.0',
        public string $latest_version = '1.0.0',
        public string $status = 'active',
        public ?string $encrypted_api_key = null,
        public ?int $created_by = null,
        public ?int $updated_by = null,
    ) {
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'package_name' => $this->package_name,
            'platform' => $this->platform,
            'icon_url' => $this->icon_url,
            'description' => $this->description,
            'current_version' => $this->current_version,
            'minimum_version' => $this->minimum_version,
            'latest_version' => $this->latest_version,
            'status' => $this->status,
            'encrypted_api_key' => $this->encrypted_api_key,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
        ];
    }

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            package_name: $data['package_name'],
            platform: $data['platform'],
            icon_url: $data['icon_url'] ?? null,
            description: $data['description'] ?? null,
            current_version: $data['current_version'] ?? '1.0.0',
            minimum_version: $data['minimum_version'] ?? '1.0.0',
            latest_version: $data['latest_version'] ?? '1.0.0',
            status: $data['status'] ?? 'active',
            encrypted_api_key: $data['encrypted_api_key'] ?? null,
            created_by: $data['created_by'] ?? null,
            updated_by: $data['updated_by'] ?? null,
        );
    }
}
