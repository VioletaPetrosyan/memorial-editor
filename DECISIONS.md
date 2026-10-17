# Decisions

## Architecture and project structure

It's one Laravel project with the Vue app inside it:

- **Laravel** (`app/`, `routes/`, `database/`) provides the JSON API at `/api/memorials` and
  stores the data in SQLite.
- **Vue** (`resources/js/`) is the user interface. Laravel serves a single HTML page
  (`resources/views/app.blade.php`), Vite builds the Vue code into it, and Vue Router handles
  the pages in the browser.
- The two only talk through the JSON API.

I kept them in one project because:

- there's one repo and one setup command
- the frontend and the API run on the same domain, so no CORS setup is needed, and adding login
  later with Sanctum's cookie authentication is simple

The trade-off is that frontend and backend are deployed together. Because the frontend only uses
the JSON API, it could move to its own project later without changing the backend.

### Backend: how a request is handled

Request → Form request → Controller → DTO → Service → Model → Resource → JSON response

- **Form requests** (`ListMemorialsRequest`, `StoreMemorialRequest`, `UpdateMemorialRequest`)
  validate the input.
- **Controller** (`MemorialController`) handles HTTP only: it takes the request, calls the
  service and returns the response.
- **DTO** (`MemorialData`) carries the validated data to the service with real types (enums,
  dates) instead of a plain array.
- **Service** (`MemorialService`) does the work: list, create, update, delete.
- **Model** (`Memorial`) reads and writes the database.
- **Resource** (`MemorialResource`) decides what a memorial looks like in JSON.

The service is small today because saving a memorial is simple. The point is that new business
logic, like notifications, an audit log or ownership checks, has an obvious home, and the
controller stays small.

### Frontend: how the code is organised

Page → Components → Form composable → Pinia store → API client → Laravel API

- **Pages** (`pages/`) are the screens: home (it opens the oldest memorial), view/edit a
  memorial, and create one. A page loads the data and decides what to show.
- **Components** (`components/`) are the building blocks: the details view, the editor form,
  the dialog and a form field.
- **Composables** (`composables/`) hold reusable logic. The main one is `useMemorialForm`, which
  manages the form while the user is editing.
- **Store** (`stores/memorial.ts`) keeps the memorial as last saved on the server.
- **API client** (`api/`) is the only place that calls the server, and it turns errors into
  typed errors.
- **Types** (`types/`) describe the API data and the form in TypeScript.
- **Utils** (`utils/`) are small helpers, such as date and label formatting.
- **Styles** (`styles/`) hold the shared SASS: colour and spacing variables, base styles,
  buttons, the page layout, and the empty and loading states. Each component keeps its own
  styles in its `.vue` file.

### Where things are

```
app/
  Http/Controllers/Api/    MemorialController
  Http/Requests/           ListMemorialsRequest, StoreMemorialRequest, UpdateMemorialRequest
  Http/Middleware/         RejectMalformedJson
  Http/Resources/          MemorialResource
  DTO/                     MemorialData
  Services/                MemorialService
  Models/                  Memorial
  Enums/                   Gender, Relationship
database/                  migration, factory, seeder
routes/                    api.php (API), web.php (serves the Vue page)
resources/js/              the Vue app (pages, components, composables, stores, api, types, utils, styles)
tests/                     Feature and Unit (PHP), js (Vue)
```

## Laravel choices

- Routes use `apiResource` with only `index`, `store`, `show`, `update` and `destroy`. The
  home page uses the list to find which memorial to open. There's no list screen yet.
- Update replaces the whole memorial, so it requires every field. Sending `null` clears one.
  `apiResource` also sends PATCH to update, and with this rule a partial PATCH gets a validation
  error instead of quietly clearing the fields it didn't send.
- Gender and relationship are PHP enums, stored as plain strings, so adding an option doesn't
  need a migration.
- "Not in the future" uses the latest date anywhere on Earth (UTC+14). The server runs on UTC,
  so a strict UTC "today" would tell a user in Tokyo that their own today is in the future.
  The date picker still stops at the user's own today.
- Every API response has the same shape: `{ data }` on success, `{ message, errors }` on failure.
  The 404 message says "Memorial not found." instead of Laravel's default, which exposes the
  model class name.
- A body that isn't valid JSON gets 400. Laravel would otherwise read it as empty and answer
  with misleading "field is required" errors.
- The API is rate limited to 60 requests a minute. With no login yet, the limit is per IP.
- Create returns 201 and delete returns 204. Delete is a soft delete, so a memorial removed by
  mistake can be restored. Running the seeder again restores the example memorial instead of
  creating a second one.

## Vue: where state lives

- **Pinia store:** the memorial as last saved on the server, plus the loading, saving and
  deleting status. Only API responses change it. Opening a memorial the store already holds,
  for example right after creating it, doesn't fetch it again.
- **Form composable** (`useMemorialForm`): what the user is typing, the field errors, and
  whether anything changed. It's created when editing starts and thrown away on Cancel. I kept
  it out of Pinia because a draft belongs to one form, not to the whole app.
- **Page component:** small UI state, such as whether the editor is open, whether the screen is
  phone-sized, and the "Changes saved." message.

How it behaves:

- On desktop, Edit replaces the details with the form. Under 768px the same form opens in a
  dialog. What the user typed lives in the editor, not in the dialog or the inline wrapper,
  so rotating a phone mid-edit doesn't lose it.
- Cancel goes back to the last saved values and asks first if something changed. The same check
  runs for Esc, the dialog's close button, clicking outside the dialog, going to another page,
  and closing the tab.
- Save sends the data and the response becomes the new saved state, with no extra reload. Then
  the editor closes and focus goes back to the Edit button.
- If saving fails and there's no field to point at (a server or network error), focus moves to
  the error message at the top of the form, so it's visible even when the user is scrolled down.
- The browser reports a date input that's only partly filled in as empty. Instead of saving
  that as "no date", the form asks the user to finish the date or clear it.
- After creating or deleting, the app replaces the page in browser history, so Back doesn't
  lead to an empty form or to the deleted memorial. Deleting a memorial that's already gone
  (for example from another tab) counts as done.
- The dialog uses the browser's built-in `<dialog>`, which keeps focus inside it and blocks the
  page behind it.

## How validation reaches the form

1. Laravel validates in the form request and returns 422 with messages per field.
2. The API client turns that response into a `ValidationError`.
3. The form shows each message under its field and a short summary at the top, and moves focus
   to the first field with an error.
4. Editing a field clears its error. The two dates are checked against each other, so editing
   either one clears both of their errors.

The rules live only in Laravel, so there is one source of truth. The browser's own form
validation is turned off so it doesn't get in front of the server's messages. The one check the
browser has to do is the half-typed date, because only the browser knows about it.

## Assumptions

- The person using the app is the memorial's owner. Login and ownership checks are out of scope.
- Relationship means what the person who passed away was to the owner. For example, "parent"
  means they were the owner's parent. "No relationship" is a real answer, different from leaving
  the field empty.
- Designation and country are free text.
- Dates can't be in the future, and the date of passing can't be before the date of birth.
  Either date can be left empty.
- The website must start with `http://` or `https://`.
- The home page opens the oldest memorial (the seeded one on a fresh database), or the create
  page if there are none.

## Not done yet, and what I'd do next

1. **Login and ownership:** Sanctum for login, a link between users and memorials, and a policy so
   only owners can edit or delete. Right now the API also shows unpublished memorials to anyone.
2. **Two people editing at once:** right now the last save wins.
3. **Shared types:** generate the TypeScript types from the PHP code instead of keeping them in
   sync by hand.
4. **End-to-end tests:** run the real browser flows automatically, for example with Playwright.
5. **Smaller things:** a list screen for all memorials (the API already has the endpoint), a
   country picker, validation while typing, and a styled confirm dialog instead of the
   browser's own.

## AI tools and how the code was checked

I used Claude Code (Anthropic). It set up the project and wrote most of the code, the tests and
these notes.

How the code was checked:

- **Tests:** 86 backend tests and 62 frontend tests, all passing.
- **Proving the tests catch bugs:** each fix was undone on purpose to confirm the right test
  fails (validation rules, the unsaved-changes check, the date handling, the "every field on
  update" rule, and every fix from the review below).
- **Static checks:** strict TypeScript checking and Laravel Pint.
- **Manual API calls** with curl.
- **A full walkthrough in the browser** at desktop and phone sizes. It found that in Chrome,
  pressing Esc twice closed the dialog even after choosing to keep editing. That's fixed.
- **A second review pass**, done as a fresh code review plus manual QA, found 15 more issues.
  The worst was that a half-typed date silently deleted the stored date. All 15 are fixed, and
  every bug has a test.
