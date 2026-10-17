<?php

namespace Tests\Feature\Api;

use App\Models\Memorial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ApiProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_requests_are_rate_limited_per_client(): void
    {
        $memorial = Memorial::factory()->create();

        for ($i = 1; $i <= 60; $i++) {
            $this->getJson("/api/memorials/{$memorial->id}")->assertOk();
        }

        $this->getJson("/api/memorials/{$memorial->id}")
            ->assertTooManyRequests()
            ->assertJsonPath('message', 'Too Many Attempts.');
    }

    public function test_malformed_json_is_rejected_with_400(): void
    {
        $memorial = Memorial::factory()->create(['first_name' => 'Eleanor']);

        $this->sendRawJson('POST', '/api/memorials', '{"first_name":')
            ->assertBadRequest()
            ->assertJsonPath('message', 'The request body is not valid JSON.');

        $this->sendRawJson('PUT', "/api/memorials/{$memorial->id}", '{"first_name": "Ann",}')
            ->assertBadRequest();

        $this->assertSame('Eleanor', $memorial->refresh()->first_name);
        $this->assertSame(1, Memorial::query()->count());
    }

    public function test_an_empty_json_body_still_gets_validation_errors(): void
    {
        $this->sendRawJson('POST', '/api/memorials', '')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['first_name', 'last_name']);
    }

    private function sendRawJson(string $method, string $uri, string $body): TestResponse
    {
        return $this->call($method, $uri, [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], $body);
    }
}
