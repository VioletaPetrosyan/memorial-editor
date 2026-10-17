<?php

namespace Database\Factories;

use App\Enums\Gender;
use App\Enums\Relationship;
use App\Models\Memorial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Memorial>
 */
class MemorialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $birthDate = fake()->dateTimeBetween('-100 years', '-30 years');

        return [
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->optional()->firstName(),
            'last_name' => fake()->lastName(),
            'website_url' => fake()->optional()->url(),
            'gender' => fake()->optional()->randomElement(Gender::cases()),
            'relationship' => fake()->optional()->randomElement(Relationship::cases()),
            'designation' => fake()->optional()->sentence(3),
            'country' => fake()->optional()->country(),
            'birth_date' => $birthDate->format('Y-m-d'),
            'passing_date' => fake()->dateTimeBetween($birthDate)->format('Y-m-d'),
            'published' => fake()->boolean(),
        ];
    }

    public function published(): static
    {
        return $this->state(['published' => true]);
    }

    public function unpublished(): static
    {
        return $this->state(['published' => false]);
    }
}
