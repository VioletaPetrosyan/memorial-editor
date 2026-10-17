<?php

namespace Tests\Feature\Api;

use App\Models\Memorial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ListMemorialsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_memorials_oldest_first_with_pagination(): void
    {
        $first = Memorial::factory()->create();
        $second = Memorial::factory()->create();

        $this->getJson('/api/memorials')
            ->assertOk()
            ->assertJsonPath('data.0.id', $first->id)
            ->assertJsonPath('data.1.id', $second->id)
            ->assertJsonPath('meta.per_page', 15)
            ->assertJsonPath('meta.total', 2);
    }

    public function test_per_page_limits_the_page_size(): void
    {
        $first = Memorial::factory()->create();
        Memorial::factory()->create();

        $this->getJson('/api/memorials?per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $first->id)
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_deleted_memorials_are_not_listed(): void
    {
        Memorial::factory()->create()->delete();
        $kept = Memorial::factory()->create();

        $this->getJson('/api/memorials')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $kept->id);
    }

    public function test_an_empty_list_is_still_wrapped_in_data(): void
    {
        $this->getJson('/api/memorials')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidPageSizes(): array
    {
        return [
            'zero' => ['0'],
            'too large' => ['101'],
            'not a number' => ['abc'],
        ];
    }

    #[DataProvider('invalidPageSizes')]
    public function test_it_rejects_invalid_page_sizes(string $perPage): void
    {
        $this->getJson("/api/memorials?per_page={$perPage}")
            ->assertUnprocessable()
            ->assertOnlyJsonValidationErrors(['per_page']);
    }
}
