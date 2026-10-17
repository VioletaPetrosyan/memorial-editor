<?php

namespace App\Http\Resources;

use App\Models\Memorial;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public JSON shape of a memorial. Keep in sync with resources/js/types/memorial.ts.
 *
 * @mixin Memorial
 */
class MemorialResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'website_url' => $this->website_url,
            'gender' => $this->gender?->value,
            'relationship' => $this->relationship?->value,
            'designation' => $this->designation,
            'country' => $this->country,
            'birth_date' => $this->birth_date?->toDateString(),
            'passing_date' => $this->passing_date?->toDateString(),
            'published' => $this->published,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
