<?php

namespace Tests\Feature\Api;

use App\Enums\Gender;
use App\Models\Memorial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateMemorialTest extends TestCase
{
    use MemorialPayloads, RefreshDatabase;

    public function test_it_creates_a_memorial(): void
    {
        $response = $this->postJson('/api/memorials', self::validPayload());

        $memorial = Memorial::query()->sole();

        $response->assertCreated()
            ->assertHeader('Location', route('memorials.show', $memorial))
            ->assertJsonPath('data.id', $memorial->id)
            ->assertJsonPath('data.first_name', 'Eleanor')
            ->assertJsonPath('data.birth_date', '1938-04-12')
            ->assertJsonPath('data.published', true);

        $this->assertSame(Gender::Female, $memorial->gender);
        $this->assertSame('2024-11-03', $memorial->passing_date->toDateString());
    }

    public function test_only_names_are_required_and_the_rest_defaults(): void
    {
        $this->postJson('/api/memorials', ['first_name' => 'Ada', 'last_name' => 'Lovelace'])
            ->assertCreated()
            ->assertJsonPath('data.middle_name', null)
            ->assertJsonPath('data.gender', null)
            ->assertJsonPath('data.birth_date', null)
            ->assertJsonPath('data.published', false);
    }

    public function test_blank_optional_strings_are_stored_as_null_and_names_are_trimmed(): void
    {
        $this->postJson('/api/memorials', self::validPayload([
            'first_name' => '  Eleanor  ',
            'middle_name' => '   ',
            'website_url' => '',
            'gender' => '',
        ]))
            ->assertCreated()
            ->assertJsonPath('data.first_name', 'Eleanor')
            ->assertJsonPath('data.middle_name', null)
            ->assertJsonPath('data.website_url', null)
            ->assertJsonPath('data.gender', null);
    }

    public function test_unknown_fields_are_ignored(): void
    {
        $this->postJson('/api/memorials', self::validPayload(['id' => 999, 'deleted_at' => '2020-01-01']))
            ->assertCreated();

        $memorial = Memorial::query()->sole();
        $this->assertNotSame(999, $memorial->id);
        $this->assertNull($memorial->deleted_at);
    }
}
