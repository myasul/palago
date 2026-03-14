# Research: PSE Edge Data Provider

## Decision: Implement HTTP access with native `fetch` and form-encoded POST bodies

**Rationale**: Node 20 already provides stable `fetch`, the feature does not
need cookies or custom session handling, and the historical endpoint only
requires standard `application/x-www-form-urlencoded` payloads. Using the
runtime-native client avoids adding an unnecessary transport dependency.

**Alternatives considered**:

- `axios`: workable, but adds dependency and wrapper behavior without solving a
  problem this provider actually has.

## Decision: Parse endpoint responses with endpoint-specific Cheerio parsers plus shared coercion helpers

**Rationale**: The HTML samples show materially different structures across the
  company list, stock data, and company information pages. Separate parsers keep
  selectors and normalization rules focused, while shared helpers handle common
  coercions for numeric strings, dates, whitespace cleanup, and empty optional
  values.

**Alternatives considered**:

- One large parser module: faster to start, but harder to reason about and more
  brittle when a single source page changes.
- Headless browser scraping: rejected because the feature explicitly forbids it
  and the endpoints are public HTML suited to lightweight parsing.

## Decision: Enforce required-vs-optional field behavior through Zod schemas after parsing

**Rationale**: The user already set the rule that invalid required fields must
  throw explicit errors while invalid optional fields must degrade to empty
  values. Parsing first and validating second makes that contract explicit and
  testable. Each parser can normalize raw strings, then a Zod schema can decide
  what is required and what may remain nullable.

**Alternatives considered**:

- Direct selector-by-selector throwing: too coupled to HTML structure and makes
  optional-field behavior inconsistent across endpoints.
- Loose parsing with no schema boundary: rejected because the constitution
  requires validated external responses.

## Decision: Throttle all upstream calls with a provider-local minimum 500ms delay

**Rationale**: The constitution and feature constraints require polite scraping.
  A provider-local request wrapper can guarantee the minimum delay for paginated
  company list requests and follow-up detail calls without relying on callers to
  remember throttling.

**Alternatives considered**:

- Caller-managed throttling: would violate the feature’s guarantee and create
  inconsistent behavior between ingestion and web consumers.
- Global queueing or token bucket: unnecessary complexity for four stateless
  public endpoints.

## Decision: Keep `cmpy_id` and `security_id` as strings throughout the provider contract

**Rationale**: The user specified that both identifiers are strings and should
  be stored as varchar values downstream. Preserving them as strings avoids
  accidental numeric coercion and matches the provider-specific identity model.

**Alternatives considered**:

- Converting identifiers to numbers: simpler for arithmetic, but these IDs are
  opaque identifiers, not quantities, and coercion adds no value.

## Decision: Use the first published security option as the default security for stock details

**Rationale**: The feature explicitly defines the first `<option>` as the
  default common-share view and requires capturing its `security_id` for later
  history calls. This keeps the contract deterministic for consumers.

**Alternatives considered**:

- Requiring callers to select a security for every detail request: more flexible
  but outside the agreed scope.
- Attempting symbol-based preferred-share filtering: brittle and unnecessary
  given the explicit first-option rule.

## Decision: Parse historical dates from source labels and leave missing volume empty

**Rationale**: The historical endpoint returns chart dates in a display-oriented
  format such as `Feb 16, 2026 00:00:00` and omits volume entirely. The provider
  must normalize dates carefully for callers and preserve source fidelity by
  returning empty volume rather than synthesizing or backfilling it.

**Alternatives considered**:

- Guessing volume from another source: rejected because it would violate
  single-source discipline.
- Returning raw date strings: pushes fragile parsing downstream and weakens the
  shared contract.

## Decision: Validate parsing behavior with fixture-backed Vitest unit tests only

**Rationale**: The feature requires no live HTTP calls in tests and provides
  local HTML fixtures for parser guidance. Unit tests against those fixtures
  make the parsers deterministic, fast, and safe to run in CI.

**Alternatives considered**:

- Live upstream smoke tests: useful later, but too unstable and explicitly out
  of scope for this plan.
- Snapshot-only tests: weaker than asserting normalized fields and coercion
  rules directly.
