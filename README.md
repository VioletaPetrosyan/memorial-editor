# Memorial Editor

A small full-stack app for viewing and editing a memorial's basic information:
a Laravel 13 JSON API with SQLite, and a Vue 3 + TypeScript + Pinia frontend built with Vite.

Design notes and trade-offs are in [DECISIONS.md](DECISIONS.md).

## Requirements

- PHP 8.3+ with the `pdo_sqlite` extension
- Composer 2
- Node.js 22.12+. Below 22.22 or 24.15, npm prints an engine warning for a test-only
  dependency of `@vue/test-utils`. It's harmless.

## Install

```bash
composer run setup
```

This installs PHP and npm dependencies, creates `.env`, generates the app key, creates the
SQLite database (`database/database.sqlite`), runs the migrations with the seeder, and builds
the frontend.

## Run

```bash
composer run dev
```

This starts the Laravel server and the Vite dev server together. Open
<http://localhost:8000>. It opens the oldest memorial (the seeded one on a fresh database), or
the create page if there are none.

Without the combined runner, use two terminals:

```bash
php artisan serve
```

```bash
npm run dev
```

To reset the data to the single seeded memorial:

```bash
php artisan migrate:fresh --seed
```

Running `php artisan db:seed` on its own is safe too. If the example memorial was deleted, it
brings it back instead of creating a second one.

## Test

```bash
composer test
```

```bash
npm test
```

```bash
npm run typecheck
```

- `composer test` runs the PHPUnit tests: API endpoints, validation, rate limiting, the
  service and the DTO (in-memory SQLite).
- `npm test` runs Vitest: the HTTP client, the store, the form composable, the dialog, the
  date helpers, and page-level tests that render the real router, store and components with
  the API module mocked.
- `npm run typecheck` runs `vue-tsc` in strict mode. `npm run build` runs it too.

## API

Every success body has a `data` key. Every error body is `{ "message": string }`, plus
`"errors": { field: string[] }` for validation errors (HTTP 422).

| Method        | Path                  | Success                            | Errors   |
|---------------|-----------------------|------------------------------------|----------|
| `GET`         | `/api/memorials`      | `200` page of memorials, oldest first | 422   |
| `GET`         | `/api/memorials/{id}` | `200` memorial                     | 404      |
| `POST`        | `/api/memorials`      | `201` memorial, `Location` header  | 422      |
| `PUT`/`PATCH` | `/api/memorials/{id}` | `200` memorial                     | 404, 422 |
| `DELETE`      | `/api/memorials/{id}` | `204` (soft delete)                | 404      |

- **List:** `?per_page=` sets the page size (1–100, default 15). The response is Laravel's
  paginated shape: `data`, `links` and `meta`.
- **Create:** only `first_name` and `last_name` are required.
- **Update:** replaces the whole record, so every field must be sent. Use `null` to clear an
  optional one. A partial update gets a 422 instead of clearing the fields it left out.
- **Dates:** can't be in the future. "Today" is the latest date anywhere on Earth (UTC+14), so
  users ahead of the server's UTC clock can still enter their own today.
- **Any endpoint:** a body that isn't valid JSON gets `400`. More than 60 requests a minute from
  one IP get `429`.

```bash
curl -s localhost:8000/api/memorials/1
```

```json
{
  "data": {
    "id": 1,
    "first_name": "Eleanor",
    "middle_name": "Rose",
    "last_name": "Whitfield",
    "website_url": "https://example.com/eleanor-whitfield",
    "gender": "female",
    "relationship": "parent",
    "designation": "Beloved mother, teacher and gardener",
    "country": "United Kingdom",
    "birth_date": "1938-04-12",
    "passing_date": "2024-11-03",
    "published": true,
    "created_at": "2026-10-16T20:01:34+00:00",
    "updated_at": "2026-10-16T20:01:34+00:00"
  }
}
```

Allowed values: `gender` is one of `male`, `female`, `other`, `prefer_not_to_say`.
`relationship` is one of `parent`, `grandparent`, `spouse`, `partner`, `child`, `sibling`,
`other_family`, `friend`, `colleague`, `other`, `no_relationship`. Both may be `null`.

## Where things are

```
app/Enums/                      Gender, Relationship
app/Http/Controllers/Api/       MemorialController (HTTP only: index, show, store, update, destroy)
app/Http/Requests/              List/Store/UpdateMemorialRequest (validation)
app/Http/Middleware/            RejectMalformedJson (400 for unparseable JSON)
app/DTO/                        MemorialData (typed input passed to the service)
app/Services/                   MemorialService (list, create, update, delete)
app/Http/Resources/             MemorialResource (the JSON shape)
app/Providers/                  AppServiceProvider (API rate limit)
bootstrap/app.php               API routing, middleware, JSON error rendering
database/                       migration, factory, MemorialSeeder
routes/api.php, routes/web.php  API routes; SPA entry points
tests/Feature/, tests/Unit/     API, service, DTO and request tests

resources/js/
  api/                          fetch wrapper with typed errors, memorial endpoints
  stores/memorial.ts            Pinia: server state and request status
  composables/                  useMemorialForm (draft state), useMediaQuery, useUnsavedChangesGuard
  components/                   MemorialDetails, MemorialEditor, BaseDialog, FormField
  pages/                        HomePage, MemorialPage (view and edit), MemorialCreatePage
  styles/                       tokens (CSS custom properties), base styles, shared BEM blocks
  types/memorial.ts             API and form types
tests/js/                       Vitest specs
```
