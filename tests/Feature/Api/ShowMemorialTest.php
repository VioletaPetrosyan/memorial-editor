<?php

namespace Tests\Feature\Api;

use App\Enums\Gender;
use App\Enums\Relationship;
use App\Models\Memorial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShowMemorialTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_the_memorial_wrapped_in_data(): void
    {
        $memorial = Memorial::factory()->create([
            'first_name' => 'Eleanor',
            'middle_name' => null,
            'last_name' => 'Whitfield',
            'website_url' => 'https://example.com',
            'gender' => Gender::Female,
            'relationship' => Relationship::NoRelationship,
            'designation' => 'Teacher',
            'country' => 'United Kingdom',
            'birth_date' => '1938-04-12',
            'passing_date' => '2024-11-03',
            'published' => true,
        ]);

        $this->getJson("/api/memorials/{$memorial->id}")
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'id' => $memorial->id,
                    'first_name' => 'Eleanor',
                    'middle_name' => null,
                    'last_name' => 'Whitfield',
                    'website_url' => 'https://example.com',
                    'gender' => 'female',
                    'relationship' => 'no_relationship',
                    'designation' => 'Teacher',
                    'country' => 'United Kingdom',
                    'birth_date' => '1938-04-12',
                    'passing_date' => '2024-11-03',
                    'published' => true,
                    'created_at' => $memorial->created_at->toIso8601String(),
                    'updated_at' => $memorial->updated_at->toIso8601String(),
                ],
            ]);
    }

    public function test_missing_memorial_returns_json_404_without_internals(): void
    {
        $this->get('/api/memorials/999')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Memorial not found.']);
    }

    public function test_soft_deleted_memorial_is_not_found(): void
    {
        $memorial = Memorial::factory()->create();
        $memorial->delete();

        $this->getJson("/api/memorials/{$memorial->id}")->assertNotFound();
    }
}
