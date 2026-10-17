<?php

namespace Tests\Feature;

use App\Models\Memorial;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederAndSpaTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_creates_one_memorial_and_is_idempotent(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $memorial = Memorial::query()->sole();
        $this->assertSame('Eleanor', $memorial->first_name);
        $this->assertTrue($memorial->published);
    }

    public function test_seeding_again_restores_a_deleted_seed_memorial_instead_of_duplicating_it(): void
    {
        $this->seed(DatabaseSeeder::class);
        $seeded = Memorial::query()->sole();
        $seeded->delete();

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(1, Memorial::withTrashed()->count());
        $this->assertFalse($seeded->refresh()->trashed());
    }

    public function test_spa_shell_is_served_for_app_paths(): void
    {
        $this->withoutVite();

        $this->get('/')->assertOk()->assertSee('<div id="app"></div>', escape: false);
        $this->get('/memorials/1')->assertOk()->assertSee('<div id="app"></div>', escape: false);
        $this->get('/memorials/new')->assertOk();
    }
}
