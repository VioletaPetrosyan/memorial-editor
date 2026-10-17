<?php

namespace Tests\Feature;

use App\DTO\MemorialData;
use App\Enums\Relationship;
use App\Models\Memorial;
use App\Services\MemorialService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemorialServiceTest extends TestCase
{
    use RefreshDatabase;

    private MemorialService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = $this->app->make(MemorialService::class);
    }

    public function test_create_stores_the_memorial(): void
    {
        $memorial = $this->service->create(new MemorialData(
            firstName: 'Ada',
            lastName: 'Lovelace',
            relationship: Relationship::Friend,
            birthDate: CarbonImmutable::parse('1815-12-10'),
        ));

        $stored = Memorial::query()->sole();
        $this->assertTrue($stored->is($memorial));
        $this->assertSame(Relationship::Friend, $stored->relationship);
        $this->assertSame('1815-12-10', $stored->birth_date?->toDateString());
        $this->assertFalse($stored->published);
    }

    public function test_update_replaces_every_field(): void
    {
        $memorial = Memorial::factory()->published()->create(['middle_name' => 'King']);

        $this->service->update($memorial, new MemorialData(firstName: 'Ada', lastName: 'Lovelace'));

        $memorial->refresh();
        $this->assertSame('Ada', $memorial->first_name);
        $this->assertNull($memorial->middle_name);
        $this->assertFalse($memorial->published);
    }

    public function test_delete_soft_deletes(): void
    {
        $memorial = Memorial::factory()->create();

        $this->service->delete($memorial);

        $this->assertSoftDeleted($memorial);
    }
}
