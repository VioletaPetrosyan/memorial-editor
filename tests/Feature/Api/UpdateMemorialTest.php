<?php

namespace Tests\Feature\Api;

use App\Enums\Relationship;
use App\Models\Memorial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateMemorialTest extends TestCase
{
    use MemorialPayloads, RefreshDatabase;

    public function test_it_updates_the_memorial_and_returns_the_saved_state(): void
    {
        $memorial = Memorial::factory()->unpublished()->create();

        $this->putJson("/api/memorials/{$memorial->id}", self::validPayload([
            'first_name' => 'Margaret',
            'relationship' => 'friend',
            'published' => true,
        ]))
            ->assertOk()
            ->assertJsonPath('data.id', $memorial->id)
            ->assertJsonPath('data.first_name', 'Margaret')
            ->assertJsonPath('data.relationship', 'friend')
            ->assertJsonPath('data.published', true);

        $memorial->refresh();
        $this->assertSame('Margaret', $memorial->first_name);
        $this->assertSame(Relationship::Friend, $memorial->relationship);
        $this->assertTrue($memorial->published);
    }

    public function test_sending_null_clears_optional_fields(): void
    {
        $memorial = Memorial::factory()->create(['middle_name' => 'Rose', 'birth_date' => '1938-04-12']);

        $this->putJson("/api/memorials/{$memorial->id}", self::validPayload([
            'middle_name' => null,
            'birth_date' => null,
        ]))
            ->assertOk()
            ->assertJsonPath('data.middle_name', null)
            ->assertJsonPath('data.birth_date', null);
    }

    public function test_every_field_must_be_sent_so_nothing_is_cleared_by_accident(): void
    {
        $memorial = Memorial::factory()->published()->create(['middle_name' => 'Rose']);

        $this->putJson("/api/memorials/{$memorial->id}", ['first_name' => 'Eleanor', 'last_name' => 'Whitfield'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['middle_name', 'birth_date', 'published']);

        $memorial->refresh();
        $this->assertSame('Rose', $memorial->middle_name);
        $this->assertTrue($memorial->published);
    }

    public function test_partial_patch_is_rejected_instead_of_clearing_other_fields(): void
    {
        $memorial = Memorial::factory()->create(['first_name' => 'Eleanor', 'middle_name' => 'Rose']);

        $this->patchJson("/api/memorials/{$memorial->id}", ['first_name' => 'Margaret', 'last_name' => 'Whitfield'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['middle_name']);

        $memorial->refresh();
        $this->assertSame('Eleanor', $memorial->first_name);
        $this->assertSame('Rose', $memorial->middle_name);
    }

    public function test_patch_with_the_full_payload_works_like_put(): void
    {
        $memorial = Memorial::factory()->create();

        $this->patchJson("/api/memorials/{$memorial->id}", self::validPayload(['first_name' => 'Margaret']))
            ->assertOk()
            ->assertJsonPath('data.first_name', 'Margaret');
    }

    public function test_updating_a_missing_memorial_returns_404(): void
    {
        $this->putJson('/api/memorials/999', self::validPayload())->assertNotFound();
    }
}
