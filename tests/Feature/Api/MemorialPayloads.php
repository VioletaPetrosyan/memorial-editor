<?php

namespace Tests\Feature\Api;

trait MemorialPayloads
{
    /**
     * A complete, valid request body; override fields per test.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected static function validPayload(array $overrides = []): array
    {
        return [
            'first_name' => 'Eleanor',
            'middle_name' => 'Rose',
            'last_name' => 'Whitfield',
            'website_url' => 'https://example.com/eleanor',
            'gender' => 'female',
            'relationship' => 'parent',
            'designation' => 'Beloved mother',
            'country' => 'United Kingdom',
            'birth_date' => '1938-04-12',
            'passing_date' => '2024-11-03',
            'published' => true,
            ...$overrides,
        ];
    }
}
