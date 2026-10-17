import { computed, reactive, ref, watch } from 'vue';
import { errorMessage, ValidationError } from '@/api/http';
import type {
    Memorial,
    MemorialField,
    MemorialFormErrors,
    MemorialFormValues,
    MemorialPayload,
} from '@/types/memorial';

export function toFormValues(memorial: Memorial | null): MemorialFormValues {
    return {
        first_name: memorial?.first_name ?? '',
        middle_name: memorial?.middle_name ?? '',
        last_name: memorial?.last_name ?? '',
        website_url: memorial?.website_url ?? '',
        gender: memorial?.gender ?? '',
        relationship: memorial?.relationship ?? '',
        designation: memorial?.designation ?? '',
        country: memorial?.country ?? '',
        birth_date: memorial?.birth_date ?? '',
        passing_date: memorial?.passing_date ?? '',
        published: memorial?.published ?? false,
    };
}

export function toPayload(values: MemorialFormValues): MemorialPayload {
    const optional = (value: string): string | null => value.trim() || null;

    return {
        first_name: values.first_name.trim(),
        middle_name: optional(values.middle_name),
        last_name: values.last_name.trim(),
        website_url: optional(values.website_url),
        gender: values.gender || null,
        relationship: values.relationship || null,
        designation: optional(values.designation),
        country: optional(values.country),
        birth_date: values.birth_date || null,
        passing_date: values.passing_date || null,
        published: values.published,
    };
}

const FIELDS = Object.keys(toFormValues(null)) as MemorialField[];

// The two dates are validated against each other ("passing can't be before birth"),
// so changing one of them can fix an error shown on the other.
const LINKED_FIELDS: Partial<Record<MemorialField, MemorialField>> = {
    birth_date: 'passing_date',
    passing_date: 'birth_date',
};

function isMemorialField(key: string): key is MemorialField {
    return (FIELDS as string[]).includes(key);
}

/**
 * Transient state of one editing session: the draft values, the server version they
 * started from (to know whether anything changed), and server validation errors.
 *
 * Deliberately not in Pinia: a draft belongs to one form instance and is thrown away
 * on cancel, so nothing else in the app should be able to read or keep it.
 */
export function useMemorialForm(initial: Memorial | null) {
    let source = initial;

    const values = reactive(toFormValues(source));
    const baseline = ref(toPayload(values));
    const errors = ref<MemorialFormErrors>({});
    /** Message for the whole form: a validation summary or a non-validation failure. */
    const formError = ref<string | null>(null);

    // Compared as payloads so "" vs null or added whitespace don't count as a change.
    const isDirty = computed(() => {
        const current = toPayload(values);

        return FIELDS.some((field) => current[field] !== baseline.value[field]);
    });

    // Editing a field clears its error (and its linked date's error); the others stay
    // until the next submit, when the server checks everything again.
    watch(
        () => ({ ...values }),
        (now, before) => {
            for (const field of FIELDS) {
                if (now[field] !== before[field]) {
                    delete errors.value[field];

                    const linked = LINKED_FIELDS[field];
                    if (linked) {
                        delete errors.value[linked];
                    }
                }
            }
        },
    );

    /** Discards edits and errors. Pass a memorial to make it the new starting point. */
    function reset(memorial: Memorial | null = source): void {
        source = memorial;
        Object.assign(values, toFormValues(memorial));
        baseline.value = toPayload(values);
        errors.value = {};
        formError.value = null;
    }

    /**
     * Sends the draft through `persist` (the store's save or create). On success the saved
     * memorial becomes the new starting point, so the form is clean again. On failure the
     * errors are put on the form and null is returned.
     */
    async function submit(persist: (payload: MemorialPayload) => Promise<Memorial>): Promise<Memorial | null> {
        errors.value = {};
        formError.value = null;

        try {
            const saved = await persist(toPayload(values));
            reset(saved);

            return saved;
        } catch (error) {
            if (error instanceof ValidationError) {
                applyValidationErrors(error);
            } else {
                formError.value = errorMessage(error);
            }

            return null;
        }
    }

    /** Shows messages next to fields, with a summary at the top of the form. */
    function setFieldErrors(fieldErrors: MemorialFormErrors, summary = 'Please correct the highlighted fields.'): void {
        errors.value = fieldErrors;
        formError.value = summary;
    }

    function applyValidationErrors(error: ValidationError): void {
        const fieldErrors: MemorialFormErrors = {};
        let hasErrorWithoutField = false;

        for (const [key, messages] of Object.entries(error.errors)) {
            if (isMemorialField(key)) {
                fieldErrors[key] = messages[0];
            } else {
                hasErrorWithoutField = true;
            }
        }

        // Laravel's summary message mentions errors we can't place next to a field.
        setFieldErrors(fieldErrors, hasErrorWithoutField ? error.message : undefined);
    }

    return { values, errors, formError, isDirty, reset, submit, setFieldErrors };
}
