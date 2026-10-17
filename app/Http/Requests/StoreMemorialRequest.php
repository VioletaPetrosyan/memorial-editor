<?php

namespace App\Http\Requests;

use App\DTO\MemorialData;
use App\Enums\Gender;
use App\Enums\Relationship;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemorialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // There is no login in this exercise; the person using the app is treated as the
        // memorial's owner. In production this would check a MemorialPolicy.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Empty strings arrive here as null (ConvertEmptyStringsToNull middleware),
     * so "nullable" also covers cleared inputs.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $latestToday = self::latestToday();

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'website_url' => ['nullable', 'string', 'max:2048', 'url:http,https'],
            'gender' => ['nullable', Rule::enum(Gender::class)],
            'relationship' => ['nullable', Rule::enum(Relationship::class)],
            'designation' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:'.$latestToday],
            // after_or_equal is skipped when birth_date is empty, so either date can be set alone.
            'passing_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:birth_date', 'before_or_equal:'.$latestToday],
            'published' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'website_url.url' => 'The website must be a valid URL starting with http:// or https://.',
            'passing_date.after_or_equal' => 'The passing date cannot be earlier than the birth date.',
            'birth_date.before_or_equal' => 'The birth date cannot be in the future.',
            'passing_date.before_or_equal' => 'The passing date cannot be in the future.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'website_url' => 'website',
        ];
    }

    public function toData(): MemorialData
    {
        return MemorialData::fromArray($this->validated());
    }

    /**
     * "Today" depends on where the user is, and the server runs on UTC. A date counts as
     * "not in the future" if it has already started somewhere on Earth (UTC+14), so a user
     * ahead of UTC can still enter their own today.
     */
    private static function latestToday(): string
    {
        return CarbonImmutable::now('Pacific/Kiritimati')->toDateString();
    }
}
