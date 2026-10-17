<?php

namespace App\Models;

use App\Enums\Gender;
use App\Enums\Relationship;
use Carbon\CarbonImmutable;
use Database\Factories\MemorialFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $first_name
 * @property string|null $middle_name
 * @property string $last_name
 * @property string|null $website_url
 * @property Gender|null $gender
 * @property Relationship|null $relationship
 * @property string|null $designation
 * @property string|null $country
 * @property CarbonImmutable|null $birth_date
 * @property CarbonImmutable|null $passing_date
 * @property bool $published
 */
#[Fillable([
    'first_name',
    'middle_name',
    'last_name',
    'website_url',
    'gender',
    'relationship',
    'designation',
    'country',
    'birth_date',
    'passing_date',
    'published',
])]
class Memorial extends Model
{
    /** @use HasFactory<MemorialFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Mirrors the column default so a new, unsaved model already reads as unpublished.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'published' => false,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'gender' => Gender::class,
            'relationship' => Relationship::class,
            'birth_date' => 'immutable_date',
            'passing_date' => 'immutable_date',
            'published' => 'boolean',
        ];
    }
}
