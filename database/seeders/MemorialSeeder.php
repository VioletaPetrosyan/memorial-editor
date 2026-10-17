<?php

namespace Database\Seeders;

use App\Enums\Gender;
use App\Enums\Relationship;
use App\Models\Memorial;
use Illuminate\Database\Seeder;

class MemorialSeeder extends Seeder
{
    /**
     * Seed the example memorial. Safe to run more than once: if it was deleted
     * it is restored instead of being created a second time.
     */
    public function run(): void
    {
        $memorial = Memorial::withTrashed()->firstOrCreate(
            ['first_name' => 'Eleanor', 'last_name' => 'Whitfield'],
            [
                'middle_name' => 'Rose',
                'website_url' => 'https://example.com/eleanor-whitfield',
                'gender' => Gender::Female,
                'relationship' => Relationship::Parent,
                'designation' => 'Beloved mother, teacher and gardener',
                'country' => 'United Kingdom',
                'birth_date' => '1938-04-12',
                'passing_date' => '2024-11-03',
                'published' => true,
            ],
        );

        if ($memorial->trashed()) {
            $memorial->restore();
        }
    }
}
