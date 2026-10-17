<?php

namespace Tests\Feature\Api;

use App\Models\Memorial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Create and update share one request class, so every rule is checked against both endpoints.
 */
class MemorialValidationTest extends TestCase
{
    use MemorialPayloads, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // "Not in the future" rules depend on the current date. At 12:00 UTC on Jan 15 it is
        // already Jan 16 at UTC+14, so the first date in the future everywhere is Jan 17.
        $this->travelTo('2026-01-15 12:00:00');
    }

    /**
     * @return array<string, array{array<string, mixed>, string}>
     */
    public static function invalidPayloads(): array
    {
        return [
            'first name missing' => [['first_name' => null], 'first_name'],
            'first name too long' => [['first_name' => str_repeat('a', 101)], 'first_name'],
            'last name missing' => [['last_name' => ''], 'last_name'],
            'last name too long' => [['last_name' => str_repeat('a', 101)], 'last_name'],
            'middle name too long' => [['middle_name' => str_repeat('a', 101)], 'middle_name'],
            'website is not a URL' => [['website_url' => 'not a url'], 'website_url'],
            'website without scheme' => [['website_url' => 'example.com'], 'website_url'],
            'website with non-http scheme' => [['website_url' => 'ftp://example.com'], 'website_url'],
            'website with javascript scheme' => [['website_url' => 'javascript:alert(1)'], 'website_url'],
            'unsupported gender' => [['gender' => 'robot'], 'gender'],
            'unsupported relationship' => [['relationship' => 'nemesis'], 'relationship'],
            'designation too long' => [['designation' => str_repeat('a', 101)], 'designation'],
            'country too long' => [['country' => str_repeat('a', 101)], 'country'],
            'birth date in wrong format' => [['birth_date' => '12/04/1938'], 'birth_date'],
            'birth date does not exist' => [['birth_date' => '1938-02-30'], 'birth_date'],
            'birth date in the future' => [['birth_date' => '2026-01-17', 'passing_date' => null], 'birth_date'],
            'passing date in the future' => [['passing_date' => '2026-01-17'], 'passing_date'],
            'passing date before birth date' => [['birth_date' => '1950-05-10', 'passing_date' => '1950-05-09'], 'passing_date'],
            'published is not a boolean' => [['published' => 'yes'], 'published'],
            'published is null' => [['published' => null], 'published'],
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    #[DataProvider('invalidPayloads')]
    public function test_create_rejects_invalid_input(array $overrides, string $field): void
    {
        $this->postJson('/api/memorials', self::validPayload($overrides))
            ->assertUnprocessable()
            ->assertOnlyJsonValidationErrors([$field]);

        $this->assertDatabaseEmpty('memorials');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    #[DataProvider('invalidPayloads')]
    public function test_update_rejects_invalid_input(array $overrides, string $field): void
    {
        $memorial = Memorial::factory()->create(['first_name' => 'Original']);

        $this->putJson("/api/memorials/{$memorial->id}", self::validPayload($overrides))
            ->assertUnprocessable()
            ->assertOnlyJsonValidationErrors([$field]);

        $this->assertSame('Original', $memorial->refresh()->first_name);
    }

    public function test_validation_errors_use_the_standard_laravel_shape(): void
    {
        $this->postJson('/api/memorials', self::validPayload([
            'birth_date' => '1950-05-10',
            'passing_date' => '1950-05-09',
        ]))
            ->assertUnprocessable()
            ->assertExactJson([
                'message' => 'The passing date cannot be earlier than the birth date.',
                'errors' => [
                    'passing_date' => ['The passing date cannot be earlier than the birth date.'],
                ],
            ]);
    }

    /**
     * @return array<string, array{array<string, mixed>}>
     */
    public static function validEdgeCases(): array
    {
        return [
            'passing on the day of birth' => [['birth_date' => '2000-01-01', 'passing_date' => '2000-01-01']],
            'only a passing date' => [['birth_date' => null, 'passing_date' => '2000-01-01']],
            'only a birth date' => [['birth_date' => '2000-01-01', 'passing_date' => null]],
            'both dates today' => [['birth_date' => '2026-01-15', 'passing_date' => '2026-01-15']],
            'today for a user ahead of UTC' => [['birth_date' => '2026-01-16', 'passing_date' => '2026-01-16']],
            'names at max length' => [['first_name' => str_repeat('a', 100), 'last_name' => str_repeat('b', 100)]],
            'http website' => [['website_url' => 'http://example.com/path?q=1']],
            'every optional field null' => [[
                'middle_name' => null, 'website_url' => null, 'gender' => null, 'relationship' => null,
                'designation' => null, 'country' => null, 'birth_date' => null, 'passing_date' => null,
            ]],
            'published sent as 0' => [['published' => 0]],
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    #[DataProvider('validEdgeCases')]
    public function test_it_accepts_valid_edge_cases(array $overrides): void
    {
        $this->postJson('/api/memorials', self::validPayload($overrides))->assertCreated();
    }

    public function test_a_user_ahead_of_utc_can_enter_their_own_today(): void
    {
        // 23:30 UTC on Oct 16 is 08:30 on Oct 17 in Tokyo.
        $this->travelTo('2026-10-16 23:30:00');

        $this->postJson('/api/memorials', self::validPayload(['passing_date' => '2026-10-17']))
            ->assertCreated();

        $this->postJson('/api/memorials', self::validPayload(['passing_date' => '2026-10-18']))
            ->assertUnprocessable()
            ->assertOnlyJsonValidationErrors(['passing_date']);
    }
}
