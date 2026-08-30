# TASK: Implement Strong Client-Side Encryption / Zero-Knowledge-Style Privacy in Cashbook

You are working on my existing Cashbook / bookkeeping web application repository:

https://github.com/NisargS28/book-keeping

The application is a Next.js/TypeScript bookkeeping application using Supabase.

## PRIMARY OBJECTIVE

I am creating a completely NEW Supabase project/database and will replace the existing database.

I want to redesign the application so that it provides the strongest practical privacy architecture:

> A user's financial entries must be encrypted on the user's device before they are sent to Supabase. Supabase/database administrators must only see ciphertext and must not possess the user's encryption key.

This is a CLIENT-SIDE ENCRYPTION / ZERO-KNOWLEDGE-STYLE architecture.

The database must never store plaintext financial information.

---

# VERY IMPORTANT SECURITY REQUIREMENT

The following must NEVER be stored in plaintext in Supabase:

* entry description
* amount
* people
* payment mode
* transaction date
* occurred_at
* transaction type
* category name
* category color
* book name
* book description
* book currency
* any other user financial/private information

The database may retain only the minimum metadata necessary for:

* authentication
* ownership
* RLS
* synchronization
* record identity
* timestamps
* encrypted payloads

The encryption key MUST NOT be stored in plaintext in Supabase.

Do NOT create an environment variable containing a global encryption key.

Do NOT create a server-side decrypt endpoint.

Do NOT use the Supabase service role key to decrypt user data.

Do NOT send plaintext financial information to server-side API routes unnecessarily.

---

# IMPORTANT: WORK IN PHASES

Do NOT attempt to implement everything in one huge change.

Work through the following phases in order.

After each phase:

1. inspect the result,
2. run type checking,
3. run lint/build where practical,
4. fix errors,
5. verify that the existing functionality has not unnecessarily been broken,
6. summarize exactly what changed,
7. then continue to the next phase.

Do not skip security verification.

---

# PHASE 0 — FULL REPOSITORY AUDIT

Before changing any code, inspect the entire repository.

Pay particular attention to:

* app/
* components/
* hooks/
* lib/
* data/
* migrations/
* Supabase client code
* authentication code
* state management
* entry creation
* entry editing
* entry deletion
* entry listing
* dashboard
* reports
* charts
* categories
* books
* profile
* search/filter/sort
* import/export

* API routes
* server actions
* middleware
* environment variables

Also inspect:

* package.json
* tsconfig.json
* next.config.mjs
* existing SQL files
* existing migrations
* README


Do not assume file names or architecture.

Determine the actual current architecture from the repository.

Create a temporary implementation plan before modifying files.

The plan should identify:

1. Where entries are created.
2. Where entries are fetched.
3. Where entries are updated.
4. Where entries are deleted.
5. Where calculations are performed.
6. Where categories are created/fetched/updated/deleted.
7. Where books are created/fetched/updated/deleted.
8. Where Supabase is accessed directly.
9. Which server-side routes exist.
10. Which client-side routes/components exist.
11. How authentication currently works.

Do not modify application behavior during this audit.

---

# PHASE 1 — DESIGN THE ENCRYPTION ARCHITECTURE

Implement a clean encryption abstraction.

Create an appropriate directory such as:

lib/encryption/

Do not blindly use these exact filenames if the existing project structure suggests a better organization.

The encryption module should provide a clean API for:

* generating cryptographically secure random values
* generating an encryption key
* deriving a key from user-controlled secret material
* encrypting JSON data
* decrypting JSON data
* encoding/decoding binary data safely
* versioning encrypted payloads
* detecting invalid/tampered ciphertext

Use browser-native Web Crypto APIs where appropriate.

Use standard cryptographic primitives.

Preferred encryption:

AES-256-GCM.

Use a cryptographically secure random IV for every encryption operation.

Never reuse an IV with the same AES-GCM key.

Use a strong password-based key derivation mechanism for user-controlled secrets.

Do not invent custom cryptographic algorithms.

Do not implement homemade encryption.

Keep encryption/decryption code isolated from UI components.

---

# PHASE 2 — DESIGN USER ENCRYPTION KEY MANAGEMENT

This is the most important architectural phase.

Do NOT simply put an encryption key in:

.env
.env.local
Supabase secrets
Vercel environment variables
server code
database tables in plaintext

That would allow the administrator to decrypt user data.

The encryption capability must be controlled by the user.

Design the following model:

User authentication
↓
Authenticated application
↓
User-controlled encryption secret / key
↓
Key derivation or secure key-unwrapping
↓
User encryption key
↓
AES-256-GCM
↓
Encrypted data

The encryption key must exist in usable form only on the user's client while needed.

The server/database must not receive the plaintext encryption key.

---

# PHASE 3 — KEY MANAGEMENT MUST SUPPORT MULTI-DEVICE USE

The application is a web app and users may use:

* laptop
* desktop
* phone
* tablet

Design the key-management system so that a user can use their encrypted data on another device.

Do not create a design where the encryption key exists only in browser localStorage with no recovery strategy.

Do not store the raw master encryption key in Supabase.

Use a secure wrapped-key/recovery architecture where appropriate.

The database may store encrypted/wrapped key material, provided the wrapping design does not allow the database administrator to recover the user's plaintext encryption key.

Think carefully about:

* new device setup
* password change
* logout
* session expiration
* browser refresh
* clearing browser storage
* recovery
* lost encryption secret
* multiple devices
* key rotation

Document these decisions.

---

# PHASE 4 — RECOVERY DESIGN

Because the administrator must not be able to decrypt user data, there must NOT be a hidden administrator recovery key.

If the user loses the required encryption secret and there is no recovery key, the data may become permanently inaccessible.

That is acceptable for the strongest privacy model, but the application should provide a clear recovery mechanism.

Design a user-controlled recovery mechanism.

For example:

* recovery key
* recovery code
* securely wrapped encryption key

The recovery secret must NOT be stored in plaintext in Supabase.

When displaying a recovery key:

* make it clear that the user must save it,
* do not automatically transmit it to the backend,
* provide a secure UX for copying/downloading/printing where appropriate.

Do not create administrator recovery access.

---

# PHASE 5 — NEW SUPABASE DATABASE SCHEMA

Because I am creating a completely NEW Supabase project, do not try to preserve the old database schema unnecessarily.

Create a clean SQL schema/migration for the new database.

The database should contain appropriate tables for:

* user_profiles
* books
* categories
* entries
* encryption/key metadata if required by the architecture

Use UUIDs.

Maintain foreign keys.

Maintain timestamps.

Maintain indexes where useful.

---

# DATABASE PRIVACY MODEL

RLS must remain enabled.

RLS and encryption solve different problems.

RLS prevents:

User A → accessing User B's records.

Encryption prevents:

Database administrator → reading User A's plaintext financial information.

Implement both.

---

# ENTRIES TABLE

Do NOT store these plaintext columns:

* description
* amount
* people
* type
* payment_mode
* date
* occurred_at
* category information

Instead use an encrypted payload.

Conceptually:

## entries

id
book_id
encrypted_data
encryption_version
created_at
updated_at

The exact schema may be adjusted if required by the implementation.

The encrypted payload should contain the complete private entry object.

Example plaintext BEFORE encryption:

{
"people": "Rahul",
"description": "Bought groceries",
"amount": 1250,
"type": "expense",
"payment_mode": "UPI",
"date": "2026-08-30",
"occurred_at": "2026-08-30T10:30:00Z",
"category": {
"id": "...",
"name": "Food"
}
}

The database should receive something equivalent to:

{
"version": 1,
"iv": "...",
"ciphertext": "..."
}

or a safely encoded equivalent.

The database must not be able to infer the plaintext from the payload.

---

# PHASE 6 — BOOK PRIVACY

Books also contain private information.

Do not leave these plaintext if the strongest privacy requirement applies:

* book name
* book description
* currency

Keep only necessary ownership/synchronization metadata plaintext.

For example, it is acceptable for RLS to need:

book.id
book.user_id

But private book metadata should be encrypted.

---

# PHASE 7 — CATEGORY PRIVACY

Categories can reveal sensitive financial information.

For example:

* Medical
* Salary
* Loan
* Personal
* Investment
* Rent

Therefore category information must also be encrypted.

Do not keep:

category.name

plaintext if the goal is strongest privacy.

The client should decrypt categories after fetching them.

---

# PHASE 8 — IMPLEMENT ENCRYPTED ENTRY CREATION

Find the existing entry creation flow in the repository.

Modify it so that the flow becomes:

User enters data
↓
Client validates data
↓
Client creates plaintext object in memory
↓
Client encrypts object
↓
Only ciphertext is sent to Supabase
↓
Plaintext object is discarded when practical

The Supabase insert must NOT contain:

amount
description
people
date
type
payment_mode

as plaintext database columns.

Only encrypted payload + required metadata should be sent.

---

# PHASE 9 — IMPLEMENT ENCRYPTED ENTRY READ

Find every location where entries are fetched.

Change the architecture to:

Supabase
↓
encrypted records
↓
client receives ciphertext
↓
client decrypts
↓
application state
↓
UI

Do not expose ciphertext to UI components unnecessarily.

Create a reusable data-access abstraction.

For example:

fetchEncryptedEntries()
decryptEntries()

or another architecture appropriate for the existing application.

Do not duplicate encryption/decryption logic throughout components.

---

# PHASE 10 — ENTRY UPDATE

Modify entry editing.

Flow:

Existing ciphertext
↓
decrypt locally
↓
show plaintext to user
↓
user edits
↓
encrypt updated object
↓
Supabase update

Never send plaintext fields to Supabase.

---

# PHASE 11 — ENTRY DELETE

Delete operations can remain metadata based.

Deleting an entry does not require decrypting the entry.

Ensure RLS still prevents deleting another user's entry.

---

# PHASE 12 — CLIENT-SIDE CALCULATIONS

This is a critical consequence of strong encryption.

The database cannot perform:

SUM(amount)

because amount is encrypted.

Therefore move private-data calculations to the client.

Find all current database queries or server-side calculations involving:

* amount
* type
* date
* category
* people
* description

Examples:

* total income
* total expenses
* balance
* daily totals
* monthly totals
* category totals
* charts
* reports
* statistics
* dashboards
* filtering
* searching
* sorting

Refactor them to operate on decrypted client-side objects.

Example:

const totalIncome = entries
.filter(entry => entry.type === "income")
.reduce((sum, entry) => sum + entry.amount, 0);

Do not send plaintext entries to a server just to calculate totals.

---

# PHASE 13 — SEARCH

Database-side plaintext search is no longer acceptable.

For example, do NOT do:

description ILIKE '%grocery%'

Instead:

1. fetch authorized encrypted records,
2. decrypt them locally,
3. perform search in memory.

Search must operate locally on decrypted data.

---

# PHASE 14 — FILTERING AND SORTING

Any filtering based on encrypted fields must happen client-side.

Examples:

* amount
* date
* type
* category
* payment mode
* people
* description

Do not accidentally reintroduce plaintext filtering through Supabase.

---

# PHASE 15 — DASHBOARD AND REPORTS

Audit the entire dashboard.

Ensure:

* balance
* income
* expense
* charts
* category breakdown
* recent transactions
* date filters
* reports

all work with decrypted client-side data.

Do not sacrifice functionality.

The UI should continue behaving exactly as it does now from the user's perspective.

Only the underlying storage/security architecture should change.

---

# PHASE 16 — AUTHENTICATION

Inspect the existing Supabase authentication implementation.

Do not break:

* sign up
* login
* logout
* session persistence
* password reset
* profile creation

Integrate encryption setup with authentication carefully.

Authentication and encryption are related but should remain conceptually separate.

Do not store a plaintext encryption secret in the user's profile.

Do not put the encryption key in auth metadata.

Do not put the encryption key in raw_user_meta_data.

---

# PHASE 17 — USER PROFILE

Review user_profiles.

Keep non-sensitive account information as appropriate.

Do not put encryption keys or recovery secrets in:

* display_name
* bio
* raw_user_meta_data
* user_profiles
* auth.users

---


# PHASE 19 — API ROUTE AUDIT

Inspect every:

app/api/**

route.

For every route ask:

"Can this route receive or return plaintext financial information?"

If yes, determine whether it violates the encryption model.

Remove unnecessary plaintext financial processing from server routes.

A server route must never have a hidden ability to decrypt user entries.

---

# PHASE 20 — SUPABASE SERVICE ROLE AUDIT

Search the entire repository for:

service_role
SUPABASE_SERVICE_ROLE_KEY
SERVICE_ROLE

Determine where it is used.

The service role may be used for legitimate administrative operations where necessary, but it must never be given an encryption key and must never be able to decrypt user financial data.

Do not expose service-role credentials to the browser.

---

# PHASE 21 — TYPESCRIPT TYPES

Update all relevant types.

Create a clear distinction between:

EncryptedEntryRecord

and:

DecryptedEntry

For example, conceptually:

EncryptedEntryRecord:

* id
* book_id
* encrypted_data
* encryption_version
* created_at
* updated_at

DecryptedEntry:

* people
* description
* amount
* type
* payment_mode
* date
* occurred_at
* category

Do not make encrypted and decrypted types interchangeable.

This helps prevent accidentally sending plaintext to Supabase.

---

# PHASE 22 — PREVENT ACCIDENTAL PLAINTEXT DATABASE WRITES

Search the entire codebase for direct inserts/updates involving:

entries
categories
books

Verify that no code does something like:

supabase.from("entries").insert({
amount,
description,
type
})

after the migration.

All private fields must go through the encryption abstraction.

Prefer centralizing database access so individual UI components cannot accidentally bypass encryption.

---

# PHASE 23 — DATABASE RLS

Implement strong RLS policies.

For books:

authenticated user can only access their own books.

For categories:

authenticated user can only access categories belonging to their books.

For entries:

authenticated user can only access entries belonging to their books.

Maintain:

SELECT
INSERT
UPDATE
DELETE

policies as appropriate.

Do not rely on encryption instead of RLS.

Use both.

---

# PHASE 24 — DATABASE ADMIN VERIFICATION

Create a security verification procedure.

After implementation, create a test user.

Create an entry:

Description:
"Very Secret Transaction"

Amount:
98765

People:
"Secret Person"

Category:
"Private"

Then inspect the database directly.

Running:

SELECT * FROM entries;

must NOT reveal:

Very Secret Transaction
98765
Secret Person
Private

The database should only contain ciphertext.

Do the same for:

* books
* categories

---

# PHASE 25 — NETWORK VERIFICATION

Use browser developer tools.

Create a new entry.

Inspect the network request to Supabase.

The request payload must NOT contain:

"Very Secret Transaction"

98765

"Secret Person"

"Private"

The request should contain ciphertext.

This test is mandatory.

---

# PHASE 26 — LOGGING AUDIT

Search the application for:

console.log
console.error
console.warn

especially around:

* entries
* encryption
* API routes

* Supabase

Ensure plaintext financial information is not accidentally logged.

Do not log encryption keys.

Do not log decrypted financial records unnecessarily.

---

# PHASE 27 — ERROR HANDLING

Encryption failures must not silently fall back to plaintext.

This is extremely important.

NEVER implement:

try {
encrypt(data)
} catch {
savePlaintext(data)
}

That is prohibited.

If encryption fails:

* show an error,
* do not save the entry,
* preserve user input locally only as appropriate,
* allow retry.

There must be NO plaintext fallback.

---

# PHASE 28 — OFFLINE/PWA REVIEW

The repository contains PWA-related configuration.

Review offline behavior carefully.

If entries are cached offline:

* cached data must remain encrypted,
* do not put plaintext financial entries into persistent browser storage unnecessarily,
* review IndexedDB/localStorage/service-worker caches,
* do not store the master encryption key insecurely.

If plaintext must exist in memory temporarily for UI rendering, that is expected.

But persistent storage should be carefully designed.

---

# PHASE 29 — PERFORMANCE

Strong encryption means the client may need to decrypt many records.

Optimize reasonably.

Do not decrypt the same record repeatedly.

Use appropriate memoization/caching in application memory where safe.

Do not sacrifice security just for performance.

For normal personal bookkeeping scale, client-side decryption of thousands of records should be acceptable.

If performance becomes an issue, investigate pagination and client-side indexing without exposing plaintext to the server.

---

# PHASE 30 — ENCRYPTION VERSIONING

Every encrypted payload must have a version.

For example:

version: 1

This allows future cryptographic migration.

Design the code so that future versions can be supported:

decrypt(version 1)
decrypt(version 2)

etc.

Do not hard-code assumptions that make future key rotation impossible.

---

# PHASE 31 — KEY ROTATION

Design for future key rotation.

Do not necessarily implement full automatic rotation in the first release unless required, but make the architecture capable of it.

Document:

* how a user changes encryption credentials,
* how encrypted records would be re-encrypted,
* how wrapped keys would be replaced,
* what happens if a rotation is interrupted.

---

# PHASE 32 — NEW DATABASE SETUP SCRIPT

Create a clean SQL file specifically for the NEW Supabase project.

For example:

migrations/001_initial_secure_schema.sql

It must include:

* tables
* foreign keys
* indexes
* triggers
* updated_at handling
* RLS
* RLS policies
* profile creation trigger if needed

The SQL must be executable against a fresh Supabase project.

Do not require the old database.

---

# PHASE 33 — ENVIRONMENT VARIABLES

Update .env.example.

Document only the variables actually required.

Never put an encryption master key in .env.

Never put a user encryption key in Vercel environment variables.

Never put a global application encryption key in Supabase secrets.

---

# PHASE 34 — DOCUMENTATION

Create a security architecture document such as:

SECURITY_ENCRYPTION.md

Document:

1. threat model
2. what the database can see
3. what the database cannot see
4. encryption algorithm
5. key derivation
6. key storage
7. recovery
8. multi-device behavior
9. RLS
10. client-side calculations

12. password reset implications
13. lost-key implications
14. backup implications
15. known limitations

Be honest.

Do not claim "100% secure".

Do not claim "impossible to hack".

Explain exactly what the architecture protects against.

---

# PHASE 35 — TESTING

Create tests for:

Encryption:

* encrypt/decrypt round trip
* different IV for each encryption
* tampered ciphertext fails
* wrong key fails
* invalid payload fails
* version handling

Entries:

* create
* read
* update
* delete

Categories:

* create
* read
* update
* delete

Books:

* create
* read
* update
* delete

Security:

* User A cannot access User B's rows
* plaintext never sent to database
* plaintext not stored in database
* encryption failure never falls back to plaintext

---

# PHASE 36 — BUILD AND TYPE CHECK

After implementation:

Run the project's existing package-manager commands.

Inspect package.json first and use the project's actual package manager/scripts.

At minimum verify:

* TypeScript
* ESLint
* production build
* tests if available

Fix all introduced errors.

Do not ignore TypeScript errors with `any`.

Do not disable lint rules simply to make the build pass.

---

# PHASE 37 — FINAL SECURITY REVIEW

Before considering the implementation complete, perform a final repository-wide search for:

* amount
* description
* people
* payment_mode
* date
* occurred_at
* category name
* book name

For every occurrence, determine whether it is:

1. legitimate client-side plaintext,
2. encrypted payload,
3. UI display,
4. database schema,
5. server-side processing.

There must be no accidental plaintext database storage.

Also search for:

* service_role
* encryption key
* master key
* decrypt
* localStorage
* sessionStorage
* IndexedDB
* console.log
* API routes

Review every relevant occurrence.

---

# CRITICAL RULES

## Rule 1

Never store user financial information in plaintext in Supabase.

## Rule 2

Never store a global encryption key on the server.

## Rule 3

Never store a user's raw encryption key in Supabase.

## Rule 4

Never expose the Supabase service-role key to the browser.

## Rule 5

Never send plaintext financial data to a server merely to calculate totals.

## Rule 6

Never fall back to plaintext if encryption fails.

## Rule 7

Never invent cryptography.

## Rule 8

Use AES-256-GCM with secure random IVs.

## Rule 9

Use secure key derivation for password-derived keys.

## Rule 10

Keep RLS enabled.

## Rule 11

Do not break existing application functionality unnecessarily.

## Rule 12

Do not silently remove features.

## Rule 13

Do not rewrite unrelated UI.

## Rule 14

Do not change the application's visual design unless required.

## Rule 15

Do not make destructive changes to the existing database because I am creating a NEW database.

## Rule 16

Do not assume the existing schema is correct. Build the new secure schema intentionally.

## Rule 17

Do not claim the application is zero-knowledge if any server-side component can decrypt the data.

---

# IMPORTANT IMPLEMENTATION STRATEGY

Do NOT start by modifying every component.

Use this order:

PHASE 0
Repository audit

↓

PHASE 1–4
Cryptography + key management design

↓

PHASE 5
New database schema

↓

PHASE 6–7
Books/categories privacy

↓

PHASE 8–11
Entry CRUD encryption

↓

PHASE 12–15
Dashboard/reports/search/filter

↓

PHASE 16–17
Authentication/profile

↓



↓

PHASE 19–23
API/RLS/security audit

↓

PHASE 24–30
Security/performance/versioning

↓

PHASE 31–34
Key rotation/docs/environment

↓

PHASE 35–37
Testing/final security audit

---

# IMPORTANT: ASK BEFORE MAKING SECURITY-CRITICAL ASSUMPTIONS

If you encounter a security decision that materially changes the privacy guarantee, do not silently choose a weaker implementation.

Examples:

* whether encryption recovery should be password-based,
* whether a recovery key is mandatory,
* whether certain metadata may remain plaintext,
* whether a feature fundamentally requires server-side plaintext.

Explain the tradeoff and choose the strongest reasonable default unless the decision would affect user data accessibility.

---

# FINAL ACCEPTANCE CRITERIA

The implementation is complete only when all of the following are true:

[ ] Fresh Supabase database can be created using the new SQL/migration.

[ ] User authentication works.

[ ] User profile creation works.

[ ] Books work.

[ ] Categories work.

[ ] Entries work.

[ ] Entry creation encrypts data before Supabase.

[ ] Entry reads decrypt on the client.

[ ] Entry editing decrypts locally and re-encrypts before saving.

[ ] Entry deletion works.

[ ] Dashboard works.

[ ] Reports work.

[ ] Charts work.

[ ] Search works.

[ ] Filtering works.

[ ] Sorting works.

[ ] No plaintext financial fields exist in the entries table.

[ ] Category private information is encrypted.

[ ] Book private information is encrypted.

[ ] RLS protects user-to-user access.

[ ] Database administrator sees ciphertext only.

[ ] Network requests contain ciphertext rather than plaintext.

[ ] Encryption keys are not stored in Supabase plaintext.

[ ] No global encryption key exists in environment variables.

[ ] No server-side decrypt endpoint exists.

[ ] Encryption failure never causes plaintext storage.

[ ] Password/recovery behavior is documented.

[ ] Multi-device behavior is documented.



[ ] No sensitive plaintext is unnecessarily logged.

[ ] TypeScript passes.

[ ] Lint passes.

[ ] Production build passes.

[ ] Security tests pass.

[ ] Documentation is complete.

---

# FINAL REPORT

At the end, provide a concise implementation report containing:

1. Files created.
2. Files modified.
3. Database schema created.
4. Encryption architecture.
5. Key-management architecture.
6. Recovery architecture.
7. RLS architecture.
8. Features migrated to client-side decryption.
10. Tests performed.
11. Build/typecheck/lint results.
12. Any remaining security concerns.
13. Exact steps I must perform in the NEW Supabase project.
14. Exact environment variables I must configure.
15. Exact first-login/setup flow for a new user.

Most importantly:

DO NOT claim that the database administrator cannot decrypt data until you have actually verified that the database contains ciphertext only and that the administrator does not possess the required decryption key.
