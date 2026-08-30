# SECURITY_ENCRYPTION.md

# Cashbook Encryption — Security Model

## What Is Protected

Cashbook uses **client-side AES-256-GCM encryption**. All private financial data is encrypted in your browser before being sent to our database. The Supabase database (and any administrator with database access) stores only:

- Your Supabase authentication identity (email, hashed password — managed by Supabase Auth)
- Wrapped (encrypted) copies of your data encryption key
- Opaque ciphertext blobs in `encrypted_data` columns

**Private data that is encrypted and never stored in plaintext:**

| Data | Fields encrypted |
|---|---|
| Entries | amount, type, description, people, payment mode, date, time, category link, notes |
| Books | name, description, currency |
| Categories | name, color |

Timestamps (`created_at`, `updated_at`) and internal IDs (`id`, `book_id`, `user_id`) remain plaintext metadata required for database indexing and row-level security.

---

## How The Keys Work

```
Your passphrase
      ↓
PBKDF2-SHA-256 (310,000 iterations, random per-user salt)
      ↓
AES-KW Wrapping Key  ←─── never stored
      ↓ (AES-KW RFC 3394)
Wrapped Data Key  ─────── stored in Supabase user_key_material
      ↓ (unwrap on login)
AES-256-GCM Data Key  ──── held in browser memory only
      ↓
Encrypts/decrypts all your records (entries, books, categories)
```

**Key storage locations:**

| Item | Where stored |
|---|---|
| Your passphrase | Never stored anywhere |
| PBKDF2-derived wrapping key | Derived in memory, used once, discarded |
| Data encryption key | Browser memory only (cleared on logout, lock, page unload) |
| Wrapped data key | Supabase `user_key_material` table |
| Recovery secret | Nowhere — shown once at setup, you must save it |
| Recovery-wrapped key | Supabase `user_key_material` table |

---

## Cryptographic Details

| Scheme | Algorithm |
|---|---|
| Record encryption | AES-256-GCM |
| IV | 12-byte cryptographically random, unique per encryption |
| Key wrapping | AES-KW (RFC 3394) |
| Key derivation | PBKDF2-SHA-256, 310,000 iterations |
| Additional Authenticated Data | Per-record context: userId + bookId + recordId + format version + key version |
| Browser API | Web Crypto API (`crypto.subtle`) — no external library |

**Additional Authenticated Data (AAD):**
Every ciphertext is bound to its specific record via AAD. Moving a ciphertext row to a different record, book, or user account causes AES-GCM authentication tag failure — the tamper is detected and decryption throws an error.

**Format versioning:** The payload includes a `fv` (format version) field enabling future cipher migrations without breaking existing records.

---

## Recovery

At first-time setup, a **64-character hex recovery secret** is generated and shown **once**. You must save this offline (password manager, printed paper, etc.).

- The recovery secret is **never transmitted to our servers**
- A recovery-wrapped copy of your data key is stored alongside the passphrase-wrapped copy
- If you forget your passphrase, you can use the recovery secret to unlock your data and set a new passphrase

**If you lose both your passphrase AND your recovery secret: your data is permanently inaccessible. There is no admin recovery path. This is intentional.**

---

## Multi-Device Access

Your data key is never synced between devices. On every device or browser:
1. Log in with your Supabase credentials
2. Enter your encryption passphrase (or recovery secret)
3. The data key is derived/unwrapped locally from the wrapped key in Supabase

Page refresh also clears the in-memory key (by design). You will be asked to re-enter your passphrase after each page refresh or new browser tab.

---

## Threat Model

### ✅ Protected Against

| Threat | Protection |
|---|---|
| Database administrator reading financial data | Only ciphertext in database; admin cannot decrypt without your passphrase |
| Supabase data breach / database dump | Ciphertext only; useless without the user's passphrase |
| Cross-user data access | Supabase Row Level Security + AAD binding ensures user isolation |
| Ciphertext row swapping (moving a row to another record/user) | AAD mismatch causes AES-GCM authentication failure |
| Replay of old ciphertext | Random IV per encryption; key version binding |
| Server-side decryption by the application | No decryption code exists server-side; all decryption is client-only |

### ⚠️ NOT Protected Against

| Threat | Explanation |
|---|---|
| **Compromised user device** (malware, keylogger) | Attacker can capture your passphrase at entry time or read the in-memory key |
| **Malicious browser extensions** | Extensions with page access can read in-memory JavaScript variables, including the data key after unlock |
| **XSS / compromised frontend deployment** | If the JavaScript served to your browser is tampered with, an attacker could exfiltrate the passphrase or key at unlock time |
| **Lost passphrase + lost recovery secret** | Data is permanently and irreversibly inaccessible |
| **Auth password reset** | Changing your Supabase auth password does NOT affect your encryption passphrase or data. They are independent. |
| **Physical access to unlocked device** | If your browser tab is open and unlocked, the data key is in memory |

---

## Frontend Security Hardening (Recommended)

The encryption key lives in browser memory during an active session. The following mitigates (but does not eliminate) the XSS risk to the in-memory key:

- **Content Security Policy (CSP):** Restrict script sources to prevent injection of malicious scripts
- **`X-Frame-Options: DENY`:** Prevent clickjacking
- **`X-Content-Type-Options: nosniff`:** Prevent MIME sniffing attacks
- **`Referrer-Policy: strict-origin-when-cross-origin`:** Limit referrer leakage
- **Subresource Integrity (SRI):** Verify integrity of any CDN-hosted scripts
- **HTTPS only:** Never serve over HTTP

These headers can be configured in `next.config.mjs` using Next.js security headers.

---

## WhatsApp Integration

The WhatsApp webhook (`/api/whatsapp`) operates server-side and cannot access your encryption key. WhatsApp entry creation is currently out of scope for the encrypted release. When re-introduced, it will use a separate encrypted-inbox design where entries are queued and encrypted by the user in the app before being committed to the ledger.

---

## Architecture Diagram

```
Browser (your device)
├── Supabase Auth session (email + hashed password)
├── In-memory: CryptoKey (AES-256-GCM data key)
│   ├── Cleared on: logout, lock, page unload, tab close
│   └── Loaded from: PBKDF2(passphrase) → AES-KW unwrap
│
├── encryptRecord(plaintext, dataKey, AAD) → EncryptedPayload
│   └── Stored in Supabase: { fv, kv, iv, ct }
│
└── decryptRecord(EncryptedPayload, dataKey, reconstructedAAD)
    └── AAD always reconstructed from: auth session + DB row metadata
        (never read from the stored payload)

Supabase Database (admin sees only):
├── user_profiles: display_name, email (via Auth)
├── user_key_material: passphrase_salt, passphrase_wrapped_key,
│                      recovery_key_salt, recovery_wrapped_key
├── books: id, user_id, encrypted_data (ciphertext)
├── categories: id, book_id, encrypted_data (ciphertext)
└── entries: id, book_id, encrypted_data (ciphertext)
```
