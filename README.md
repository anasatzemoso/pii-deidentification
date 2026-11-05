# pii-deidentification-service

A rule-based service for de-identifying personally identifiable information
(PII) in free text. It detects PII with regular expressions plus custom
validation, then replaces each match with a typed token.

## Purpose

Accept text over HTTP and return a de-identified copy in which detected PII —
email addresses, phone numbers, SSNs, dates of birth, credit card numbers, and
IPv4 addresses — is replaced with tokens such as `[EMAIL]`. Detection is purely
rule-based: no database, no external PII services, and no machine learning.

The domain logic (detection, validation, resolution, replacement, and
orchestration) is independent of Express so it can be tested and reused without
the HTTP layer.

## Technology stack

- **Node.js** (22.x)
- **TypeScript** (strict mode)
- **Express** 5
- **Jest** + **ts-jest**, **supertest** for API tests
- **Prettier**

## Project structure

```
src/
  config/        pii.config.ts            Runtime config + entityPriority + replacementTokens
  types/         pii.types.ts             Shared domain types (EntityType, DetectionSpan, ...)
  detectors/     email|phone|ssn|dob|credit-card|ip-address.detector.ts
                 validators.ts            Pure validators (Luhn, calendar date, SSN, IPv4)
                 detector.registry.ts     Central list of detectors
  services/      resolver.service.ts      Overlap/duplicate resolution by priority
                 replacer.service.ts      Token replacement
                 redaction.service.ts     Orchestration (domain entry point)
  controllers/   redaction.controller.ts  HTTP handler for /deidentify
  routes/        redaction.routes.ts      Route + validation wiring
  middlewares/   validation.middleware.ts Request body validation
                 error.middleware.ts      Centralized error handling
  app.ts                                  Builds/configures the Express app
  server.ts                               Starts the HTTP listener

tests/           Unit + integration tests mirroring src/
```

### Architectural notes

- The PII domain (`detectors/`, `services/`) never imports Express.
- HTTP concerns stay in `controllers/`, `routes/`, `middlewares/`, `app.ts`.
- Application wiring (`app.ts`) is separate from server startup (`server.ts`).
- Raw input text and PII values are never logged.
- Imports are relative; no path aliases.

## Setup

Requires Node.js 18+ (developed on 22.x).

```bash
npm install
cp .env.example .env     # optional; PORT defaults to 3000
```

### Scripts

```bash
npm run dev          # Run the server with ts-node
npm run build        # Compile TypeScript to dist/
npm start            # Run the compiled server (dist/server.js)
npm test             # Run the Jest test suite
npm run format       # Format source with Prettier
npm run format:check # Check formatting
```

## API

### `GET /health`

Returns `200 { "status": "ok" }`.

### `POST /deidentify`

Request body:

```json
{
  "text": "Contact john@example.com or 123-45-6789",
  "entities": ["EMAIL", "SSN"]
}
```

- `text` (required): non-empty string to de-identify.
- `entities` (optional): array restricting which entity types to detect. Valid
  values: `EMAIL`, `PHONE`, `SSN`, `DATE_OF_BIRTH`, `CREDIT_CARD`,
  `IP_ADDRESS`. Semantics:
  - **Omitted** — all six supported entities are detected.
  - **Empty array `[]`** — no entity detection is performed; the text is
    returned unchanged with `entitiesDetected: {}`.
  - Identifiers are **case-sensitive** and must be upper-case exactly as listed
    (e.g. `email` is rejected with `400`).

Response `200`:

```json
{
  "deidentifiedText": "Contact [EMAIL] or [SSN]",
  "entitiesDetected": { "EMAIL": 1, "SSN": 1 }
}
```

- `deidentifiedText` is the input with each resolved match replaced by its
  token.
- `entitiesDetected` is an object mapping each detected entity type to the
  number of occurrences replaced (counted from the final resolved spans). Only
  types with at least one replacement are included; no detections yields `{}`.

> **Privacy note:** the HTTP response exposes only these two fields. The
> internal detection spans — offsets and the raw matched values — stay inside
> the domain pipeline (`deidentify()` / resolver / replacer) and are never
> serialised to the client, so no raw PII or positional data leaves the
> service.

Error responses: `400` with `{ "status": "error", "message": "..." }` for a
missing/empty `text`, an invalid `entities` array, or malformed JSON.

## Replacement tokens & priority

Configured in `src/config/pii.config.ts`:

| Entity        | Token             | Priority |
| ------------- | ----------------- | -------- |
| SSN           | `[SSN]`           | 100      |
| CREDIT_CARD   | `[CREDIT_CARD]`   | 90       |
| EMAIL         | `[EMAIL]`         | 80       |
| IP_ADDRESS    | `[IP_ADDRESS]`    | 70       |
| PHONE         | `[PHONE]`         | 60       |
| DATE_OF_BIRTH | `[DATE_OF_BIRTH]` | 50       |

When two detected spans overlap, the higher-priority entity wins.

## Supported formats (summary)

- **EMAIL** — standard, subdomains, plus addressing; ASCII only.
- **PHONE** — NANP 10-digit with optional 1-3 digit country code and common
  separators / parenthesized area code.
- **SSN** — `AAA-GG-SSSS` with optional hyphen/space or bare 9 digits, with
  structural validation.
- **DATE_OF_BIRTH** — only dates preceded by an explicit DOB context cue
  (`DOB:`, `D.O.B.:`, `Date of Birth:`, `Born:`, `Born on`; case-insensitive,
  optional colon). Date shapes: ISO (`YYYY-MM-DD`), numeric US (`MM/DD/YYYY`
  with `/ . -`), and textual (`May 21, 1990` / `21 May 1990`); year 1900–current
  and calendar-validated.
- **CREDIT_CARD** — 13-19 digits with optional space/hyphen separators, Luhn-valid.
- **IP_ADDRESS** — IPv4 dotted-quad with octet range validation.

## Design Decisions, Trade-offs, and Potential Improvements

### Design decisions

- **Domain logic is independent of HTTP/Express.** Detection, validation,
  resolution, and replacement live under `src/detectors` and `src/services` and
  never import Express; the HTTP layer (`controllers`, `routes`, `middlewares`,
  `app.ts`) only adapts requests and responses. The domain entry point
  `deidentify()` is usable without the API, which keeps it easy to test and
  reuse.
- **Regex detection combined with custom validation.** Each detector uses a
  regex to locate candidates, then a pure validator rejects structurally invalid
  ones — Luhn for credit cards, calendar/leap-year checks for dates, SSN
  area/group/serial rules, and IPv4 octet ranges (`src/detectors/validators.ts`).
  Separating "find" from "verify" keeps both sides small and unit-testable and
  reduces false positives.
- **Deterministic, priority-based overlap resolution.** When spans overlap,
  `resolveMatches` orders candidates by entity priority (highest first), then by
  length, then by start index, and greedily accepts spans that do not overlap an
  already-accepted one. The result is deterministic and independent of detector
  execution order (`src/config/pii.config.ts`, `src/services/resolver.service.ts`).
- **Offset-safe replacement.** `replaceMatches` sorts the resolved spans by start
  and rebuilds the output in a single left-to-right pass using the original
  `[start, end)` offsets: it copies the text between spans and appends each
  entity token. Because it reads from the original string and writes to a new
  one, earlier replacements never shift later offsets, so text outside spans —
  including punctuation, newlines, and Unicode — is preserved exactly
  (`src/services/replacer.service.ts`).
- **Context-gated DATE_OF_BIRTH.** A date is treated as a date of birth only when
  preceded by an explicit cue (`DOB:`, `D.O.B.:`, `Date of Birth:`, `Born:`,
  `Born on`), matched as a zero-width look-behind so the reported span covers
  only the date. **Trade-off:** this removes false positives on ordinary dates
  (invoices, appointments) at the cost of missing genuine birth dates that carry
  no recognizable cue or phrase it differently.

### Potential improvements (future work — not implemented)

- Broaden PHONE toward fuller international/E.164 coverage with region-aware
  validation (the current detector is NANP-oriented).
- Strengthen CREDIT_CARD beyond Luhn with issuer/length (IIN) checks to reduce
  coincidental matches on long Luhn-valid digit runs.
- Extend the DOB cue vocabulary (e.g. `Birthdate`, `b.`) and allow a cue that is
  near but not immediately adjacent to the date.
- Add an optional TLD/format tightening for EMAIL to reduce matches on
  email-shaped tokens that are not real addresses.

## Known limitations

- Detection is pragmatic, not exhaustive; see each detector's header and the
  "Known limitations" section of the implementation report.
- Email: no IDN/Unicode or quoted local parts; no TLD allow-list (an
  email-shaped token can match).
- Phone: NANP/E.164-with-country-code focus; not full international coverage.
- SSN: structural rules only (not a real issuance check); bare 9-digit runs can
  match if they pass the rules.
- DATE_OF_BIRTH: a date is detected only when immediately preceded by one of the
  supported context cues (with optional colon/whitespace between the cue and the
  date); bare dates and non-DOB dates such as invoice or appointment dates are
  not matched. The cue set is fixed and must be adjacent to the date — a cue
  separated from the date by other words is not recognized. Any calendar-valid
  date following a cue is treated as a DOB (the semantic role cannot be proven
  from the value). Assumes US month/day ordering; 2-digit years and year-first
  dotted dates are not supported.
- IP_ADDRESS: IPv4 only; IPv6 is not supported.

## Implementation status

Mandatory application implemented: all six detectors, validators, resolution,
replacement, orchestration, and the `POST /deidentify` API. Comprehensive test
execution and review are conducted in a dedicated verification phase.
