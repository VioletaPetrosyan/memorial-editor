<?php

namespace App\Http\Requests;

use Illuminate\Support\Arr;

/**
 * Update replaces the whole memorial, so every field must be sent (null clears an optional one).
 *
 * The resource route sends both PUT and PATCH here. Requiring every field means a partial
 * PATCH gets a validation error instead of silently clearing the fields it left out.
 */
class UpdateMemorialRequest extends StoreMemorialRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return self::requireEveryField(parent::rules());
    }

    /**
     * Adds "present" to every field's rules. Rules can be written as an array, a single
     * rule object, or a "a|b" string, which is split the same way Laravel splits it.
     *
     * @param  array<string, mixed>  $rules
     * @return array<string, array<mixed>>
     */
    public static function requireEveryField(array $rules): array
    {
        return array_map(
            fn (mixed $fieldRules): array => [
                'present',
                ...(is_string($fieldRules) ? explode('|', $fieldRules) : Arr::wrap($fieldRules)),
            ],
            $rules,
        );
    }
}
