<?php

namespace App\DTO;

use App\Enums\Gender;
use App\Enums\Relationship;
use Carbon\CarbonImmutable;

/**
 * Memorial input passed from the HTTP layer to MemorialService, with real types
 * (enums, dates) instead of a loose request array.
 */
final readonly class MemorialData
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public ?string $middleName = null,
        public ?string $websiteUrl = null,
        public ?Gender $gender = null,
        public ?Relationship $relationship = null,
        public ?string $designation = null,
        public ?string $country = null,
        public ?CarbonImmutable $birthDate = null,
        public ?CarbonImmutable $passingDate = null,
        public bool $published = false,
    ) {}

    /**
     * Builds the DTO from validated input. Fields that weren't sent get the defaults above.
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            firstName: $data['first_name'],
            lastName: $data['last_name'],
            middleName: $data['middle_name'] ?? null,
            websiteUrl: $data['website_url'] ?? null,
            gender: isset($data['gender']) ? Gender::from($data['gender']) : null,
            relationship: isset($data['relationship']) ? Relationship::from($data['relationship']) : null,
            designation: $data['designation'] ?? null,
            country: $data['country'] ?? null,
            birthDate: isset($data['birth_date']) ? CarbonImmutable::parse($data['birth_date']) : null,
            passingDate: isset($data['passing_date']) ? CarbonImmutable::parse($data['passing_date']) : null,
            published: (bool) ($data['published'] ?? false),
        );
    }

    /**
     * Column => value pairs for the Memorial model.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'first_name' => $this->firstName,
            'middle_name' => $this->middleName,
            'last_name' => $this->lastName,
            'website_url' => $this->websiteUrl,
            'gender' => $this->gender,
            'relationship' => $this->relationship,
            'designation' => $this->designation,
            'country' => $this->country,
            'birth_date' => $this->birthDate,
            'passing_date' => $this->passingDate,
            'published' => $this->published,
        ];
    }
}
