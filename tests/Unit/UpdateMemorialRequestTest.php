<?php

namespace Tests\Unit;

use App\Enums\Gender;
use App\Http\Requests\UpdateMemorialRequest;
use Illuminate\Validation\Rule;
use PHPUnit\Framework\TestCase;

class UpdateMemorialRequestTest extends TestCase
{
    public function test_it_adds_present_to_every_rule_style(): void
    {
        $enumRule = Rule::enum(Gender::class);

        $rules = UpdateMemorialRequest::requireEveryField([
            'as_array' => ['required', 'string'],
            'as_string' => 'nullable|string|max:50',
            'as_object' => $enumRule,
        ]);

        $this->assertSame([
            'as_array' => ['present', 'required', 'string'],
            'as_string' => ['present', 'nullable', 'string', 'max:50'],
            'as_object' => ['present', $enumRule],
        ], $rules);
    }
}
