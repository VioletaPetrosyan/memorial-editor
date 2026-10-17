<?php

namespace Tests\Unit;

use App\DTO\MemorialData;
use App\Enums\Gender;
use App\Enums\Relationship;
use PHPUnit\Framework\TestCase;

class MemorialDataTest extends TestCase
{
    public function test_it_converts_validated_input_to_typed_values(): void
    {
        $data = MemorialData::fromArray([
            'first_name' => 'Eleanor',
            'middle_name' => 'Rose',
            'last_name' => 'Whitfield',
            'website_url' => 'https://example.com',
            'gender' => 'female',
            'relationship' => 'no_relationship',
            'designation' => 'Teacher',
            'country' => 'United Kingdom',
            'birth_date' => '1938-04-12',
            'passing_date' => '2024-11-03',
            'published' => '1',
        ]);

        $this->assertSame(Gender::Female, $data->gender);
        $this->assertSame(Relationship::NoRelationship, $data->relationship);
        $this->assertSame('1938-04-12', $data->birthDate?->toDateString());
        $this->assertSame('2024-11-03', $data->passingDate?->toDateString());
        $this->assertTrue($data->published);
    }

    public function test_fields_that_were_not_sent_get_defaults(): void
    {
        $data = MemorialData::fromArray(['first_name' => 'Ada', 'last_name' => 'Lovelace']);

        $this->assertNull($data->middleName);
        $this->assertNull($data->gender);
        $this->assertNull($data->birthDate);
        $this->assertFalse($data->published);
    }

    public function test_to_array_uses_the_model_column_names(): void
    {
        $data = new MemorialData(firstName: 'Ada', lastName: 'Lovelace', gender: Gender::Female);

        $this->assertSame([
            'first_name' => 'Ada',
            'middle_name' => null,
            'last_name' => 'Lovelace',
            'website_url' => null,
            'gender' => Gender::Female,
            'relationship' => null,
            'designation' => null,
            'country' => null,
            'birth_date' => null,
            'passing_date' => null,
            'published' => false,
        ], $data->toArray());
    }
}
