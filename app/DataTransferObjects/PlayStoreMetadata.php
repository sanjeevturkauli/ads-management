<?php

namespace App\DataTransferObjects;

/**
 * Immutable value object holding metadata scraped from the Play Store.
 */
readonly class PlayStoreMetadata
{
    public function __construct(
        public string  $packageName,
        public ?string $title           = null,
        public ?string $iconUrl         = null,
        public ?string $bannerUrl       = null,
        public ?string $description     = null,
        public ?string $developerName   = null,
        public ?string $category        = null,
        public ?float  $rating          = null,
        public ?int    $ratingsCount    = null,
        public ?string $installs        = null,
        public ?string $privacyPolicyUrl = null,
        public ?string $websiteUrl      = null,
        public ?string $playStoreUrl    = null,
        public array   $screenshots     = [],
        public ?string $storeLastUpdated = null,
    ) {}

    public function toArray(): array
    {
        return array_filter([
            'name'                   => $this->title,
            'icon_url'               => $this->iconUrl,
            'banner_url'             => $this->bannerUrl,
            'description'            => $this->description,
            'developer_name'         => $this->developerName,
            'category'               => $this->category,
            'rating'                 => $this->rating,
            'ratings_count'          => $this->ratingsCount,
            'installs'               => $this->installs,
            'privacy_policy_url'     => $this->privacyPolicyUrl,
            'website_url'            => $this->websiteUrl,
            'play_store_url'         => $this->playStoreUrl,
            'screenshots'            => ! empty($this->screenshots) ? $this->screenshots : null,
            'store_last_updated_at'  => $this->storeLastUpdated,
        ], fn($v) => $v !== null);
    }

    public function isEmpty(): bool
    {
        return $this->title === null && $this->iconUrl === null;
    }
}
