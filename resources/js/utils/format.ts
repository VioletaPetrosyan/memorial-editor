import type { Gender, Memorial, Relationship } from '@/types/memorial';

export const GENDER_LABELS: Record<Gender, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    prefer_not_to_say: 'Prefer not to say',
};

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
    parent: 'Parent',
    grandparent: 'Grandparent',
    spouse: 'Spouse',
    partner: 'Partner',
    child: 'Child',
    sibling: 'Sibling',
    other_family: 'Other family',
    friend: 'Friend',
    colleague: 'Colleague',
    other: 'Other',
    no_relationship: 'No relationship',
};

type NameParts = Pick<Memorial, 'first_name' | 'middle_name' | 'last_name'>;

export function fullName({ first_name, middle_name, last_name }: NameParts): string {
    return [first_name, middle_name, last_name].filter(Boolean).join(' ');
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

/**
 * Formats a calendar date (YYYY-MM-DD). It is parsed and formatted in UTC so it never
 * shifts to the previous day for viewers west of UTC.
 */
export function formatDate(isoDate: string): string {
    return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}

/** "1938 – 2024", "Born 1938", "Passed away 2024", or null when no dates are known. */
export function lifeYears({ birth_date, passing_date }: Pick<Memorial, 'birth_date' | 'passing_date'>): string | null {
    const born = birth_date?.slice(0, 4);
    const passed = passing_date?.slice(0, 4);

    if (born && passed) return `${born} – ${passed}`;
    if (born) return `Born ${born}`;
    if (passed) return `Passed away ${passed}`;

    return null;
}

/** Full years between two calendar dates, or null if either is missing. */
export function ageAtPassing({ birth_date, passing_date }: Pick<Memorial, 'birth_date' | 'passing_date'>): number | null {
    if (!birth_date || !passing_date) return null;

    const years = Number(passing_date.slice(0, 4)) - Number(birth_date.slice(0, 4));
    // "MM-DD" strings compare correctly as text.
    const hadBirthdayThatYear = passing_date.slice(5) >= birth_date.slice(5);

    return hadBirthdayThatYear ? years : years - 1;
}

/** Today's date in the viewer's timezone, as YYYY-MM-DD (for date input limits). */
export function todayIsoDate(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
}
