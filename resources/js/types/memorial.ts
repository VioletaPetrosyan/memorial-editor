// Mirrors app/Enums/*.php and app/Http/Resources/MemorialResource.php.

export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export type Gender = (typeof GENDERS)[number];

export const RELATIONSHIPS = [
    'parent',
    'grandparent',
    'spouse',
    'partner',
    'child',
    'sibling',
    'other_family',
    'friend',
    'colleague',
    'other',
    'no_relationship',
] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

/** A memorial as returned by the API. Dates are ISO calendar dates (YYYY-MM-DD). */
export interface Memorial {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    website_url: string | null;
    gender: Gender | null;
    relationship: Relationship | null;
    designation: string | null;
    country: string | null;
    birth_date: string | null;
    passing_date: string | null;
    published: boolean;
    created_at: string;
    updated_at: string;
}

/** Request body for POST /api/memorials and PUT /api/memorials/{id}. */
export type MemorialPayload = Omit<Memorial, 'id' | 'created_at' | 'updated_at'>;

export type MemorialField = keyof MemorialPayload;

/**
 * What the form inputs bind to. Inputs and selects work with strings, so "empty" is ''
 * here and only becomes null when the payload is built (see toPayload()).
 */
export interface MemorialFormValues {
    first_name: string;
    middle_name: string;
    last_name: string;
    website_url: string;
    gender: Gender | '';
    relationship: Relationship | '';
    designation: string;
    country: string;
    birth_date: string;
    passing_date: string;
    published: boolean;
}

/** First server message per field. */
export type MemorialFormErrors = Partial<Record<MemorialField, string>>;
