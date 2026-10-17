<?php

namespace Tests\Feature\Api;

use App\Models\Memorial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteMemorialTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_soft_deletes_the_memorial(): void
    {
        $memorial = Memorial::factory()->create();

        $this->deleteJson("/api/memorials/{$memorial->id}")->assertNoContent();

        $this->assertSoftDeleted($memorial);
        $this->getJson("/api/memorials/{$memorial->id}")->assertNotFound();
    }

    public function test_deleting_a_missing_memorial_returns_404(): void
    {
        $this->deleteJson('/api/memorials/999')->assertNotFound();
    }
}
