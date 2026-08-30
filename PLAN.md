# Mobile-first ledger details redesign

## Summary

Replace the mobile horizontal table with date-grouped, tappable transaction cards inspired by the reference. Preserve the desktop table, add a read-only entry-detail bottom sheet, and retain the existing light/dark theme behavior.

## Key changes

- Add `entries.occurred_at timestamptz` through a new Supabase migration; backfill existing rows using each entry’s recorded date plus its creation time, then index it for ledger ordering.
- Update entry creation and editing to save the date and time as `occurred_at`; WhatsApp-created entries use the server receive time.
- Keep `date` for compatibility, but use `occurred_at` for sorting, date grouping, display, and filtering.
- Replace the mobile ledger table with descending date sections and compact transaction cards showing category/payment chips, description, optional People, signed amount, running balance, and entry time.
- Make each mobile card tappable. Open a read-only bottom sheet with amount/type, description, People, category, payment mode, transaction date/time, running balance, and record metadata; provide explicit Edit and Delete actions.
- Keep the desktop table, but add a View action so it opens the same detail sheet.
- Add a date-range filter alongside the current search, type, and category filters. Show date controls in the desktop filter row and the mobile filter sheet; clear filters resets all values.
- Keep the fixed Cash In / Cash Out mobile action bar and ensure cards, filters, and detail sheet remain usable above it and the mobile navigation.

## Validation

- Confirm a selected transaction time persists after creating and editing an entry.
- Confirm existing entries display under the correct date after migration backfill.
- Verify date range, search, type, and category filters work together and clear correctly.
- Verify card tap, sheet close, edit, and delete flows on mobile; verify desktop View opens the same details.
- Run TypeScript and production build checks.

## Assumptions

- The reference is a layout and interaction reference, not an always-dark-theme requirement.
- “People” remains optional and is shown only when present.
- Existing databases will run the new migration in Supabase SQL Editor before deploying the UI.
