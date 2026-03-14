---

description: "Task list for PSE Edge provider implementation"
---

# Tasks: PSE Edge Data Provider

**Input**: Design documents from `/specs/001-pse-edge-provider/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are required for this feature. Each parser must be covered by fixture-backed Vitest tests with no live HTTP calls.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story while keeping shared parser prerequisites in the foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Workspace package: `packages/pse-edge/`
- Shared fixtures: `packages/pse-data/`
- Consumer workspace manifests: `apps/ingestion/package.json`, `apps/web/package.json`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new shared package skeleton and workspace configuration required before feature code is added

- [x] T001 Create the shared package manifest in `packages/pse-edge/package.json`
- [x] T002 Create the package TypeScript config in `packages/pse-edge/tsconfig.json`
- [x] T003 Create the package entrypoint stub in `packages/pse-edge/src/index.ts`
- [ ] ~~T004 Create the package test bootstrap in `packages/pse-edge/tests/setup.ts`~~

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared types, schemas, parser modules, and parser tests that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Define provider interfaces and result types in `packages/pse-edge/src/types.ts`
- [x] T006 Create shared normalization helpers in `packages/pse-edge/src/utils/numbers.ts`, `packages/pse-edge/src/utils/dates.ts`, and `packages/pse-edge/src/utils/sleep.ts`
- [x] T007 Create shared Zod schemas for all provider responses in `packages/pse-edge/src/schemas.ts`
- [x] T008 [P] Implement the company list parser in `packages/pse-edge/src/parsers/company-list.ts` using `packages/pse-data/search.html`
- [x] T009 [P] Add fixture-backed Vitest coverage for the company list parser in `packages/pse-edge/tests/company-list.test.ts` using `packages/pse-data/search.html`
- [x] T010 [P] Implement the stock data parser in `packages/pse-edge/src/parsers/stock-data.ts` using `packages/pse-data/stockData.html`
- [x] T011 [P] Add fixture-backed Vitest coverage for the stock data parser in `packages/pse-edge/tests/stock-data.test.ts` using `packages/pse-data/stockData.html`
- [x] T012 [P] Implement the company info parser in `packages/pse-edge/src/parsers/company-info.ts` using `packages/pse-data/company_information.html`
- [x] T013 [P] Add fixture-backed Vitest coverage for the company info parser in `packages/pse-edge/tests/company-info.test.ts` using `packages/pse-data/company_information.html`
- [x] T014 [P] Add the historical response fixture in `packages/pse-data/disclosure-cht.json` and implement the historical prices parser in `packages/pse-edge/src/parsers/historical-prices.ts` using that fixture
  - [x] T014a [MANUAL] Create packages/pse-data/disclosure-cht.json by running:
    curl -X POST https://edge.pse.com.ph/common/DisclosureCht.ax \
      -d "cmpy_id=86&security_id=158&startDate=03-01-2026&endDate=03-15-2026"
    Save the response as packages/pse-data/disclosure-cht.json
    Note: Fixture already existed before this implementation session, so this manual step was not repeated.

  - [x] T014b [P] Implement the historical prices parser in
    packages/pse-edge/src/parsers/historical-prices.ts
    using packages/pse-data/disclosure-cht.json
- [x] T015 [P] Add fixture-backed Vitest coverage for the historical prices parser in `packages/pse-edge/tests/historical-prices.test.ts` using `packages/pse-data/disclosure-cht.json`

**Checkpoint**: Shared types, schemas, parsers, and parser tests are ready for provider method integration

---

## Phase 3: User Story 1 - Sync Listed Companies (Priority: P1) 🎯 MVP

**Goal**: Expose a provider method that returns the full paginated listed-company directory with extracted provider IDs

**Independent Test**: Call `getCompanyList()` against mocked paginated responses and confirm it aggregates all pages, returns required identity fields, and fails the full operation if any page request fails

### Implementation for User Story 1

- [x] T016 [US1] Implement paginated company directory fetching and `getCompanyList()` in `packages/pse-edge/src/provider.ts`
- [x] T017 [US1] Add provider-level tests for `getCompanyList()` pagination and failure behavior in `packages/pse-edge/tests/provider-company-list.test.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Retrieve Company and Stock Details (Priority: P2)

**Goal**: Expose provider methods that return stock snapshot data and company profile data for one issuer

**Independent Test**: Call `getStockData(edgeCmpyId)` and `getCompanyInfo(edgeCmpyId)` against mocked responses and confirm the first security option is used, the security ID is captured, optional fields degrade cleanly, and the logo URL is absolute

### Implementation for User Story 2

- [ ] T018 [US2] Implement `getStockData(edgeCmpyId)` in `packages/pse-edge/src/provider.ts`
- [ ] T019 [US2] Implement `getCompanyInfo(edgeCmpyId)` in `packages/pse-edge/src/provider.ts`
- [ ] T020 [US2] Add provider-level tests for stock detail and company profile methods in `packages/pse-edge/tests/provider-company-detail.test.ts`

**Checkpoint**: User Story 2 is fully functional and testable independently

---

## Phase 5: User Story 3 - Retrieve Historical Prices (Priority: P3)

**Goal**: Expose a provider method that returns normalized historical price rows for a company-security pair and date range

**Independent Test**: Call `getHistoricalPrices(edgeCmpyId, edgeSecId, startDate, endDate)` against mocked form-encoded responses and confirm date normalization, scientific-notation value parsing, and `volume = null` for every returned row

### Implementation for User Story 3

- [ ] T021 [US3] Implement form-encoded historical requests and `getHistoricalPrices(edgeCmpyId, edgeSecId, startDate, endDate)` in `packages/pse-edge/src/provider.ts`
- [ ] T022 [US3] Add provider-level tests for historical price requests and response normalization in `packages/pse-edge/tests/provider-historical-prices.test.ts`

**Checkpoint**: User Story 3 is fully functional and testable independently

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize exports, consumer wiring, and verification for the shared package

- [ ] T023 Export the provider, parsers, schemas, and public types from `packages/pse-edge/src/index.ts`
- [ ] T024 Update workspace dependency wiring in `apps/ingestion/package.json` and `apps/web/package.json` to add `@palago/pse-edge`
- [ ] T025 Run final parser verification with `cd packages/pse-edge && npx vitest run` and if tests fail, the feature is not complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies, starts immediately
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and can proceed after US1 or in parallel if `provider.ts` work is coordinated carefully
- **User Story 3 (Phase 5)**: Depends on Foundational completion and can proceed after US1 or in parallel if `provider.ts` work is coordinated carefully
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Uses the shared company-list parser and shared schemas from Phase 2
- **User Story 2 (P2)**: Uses the stock-data and company-info parsers from Phase 2
- **User Story 3 (P3)**: Uses the historical-prices parser from Phase 2 and the company/security IDs surfaced by US1 or US2 consumers

### Within Each User Story

- Implement provider method logic before provider-level tests
- Keep request throttling and endpoint error handling inside `packages/pse-edge/src/provider.ts`
- Finish the story’s method and tests before moving to export and wiring work

### Parallel Opportunities

- T008, T010, T012, and T014 can run in parallel after T007 completes
- T009, T011, T013, and T015 can run in parallel immediately after their corresponding parser tasks
- Provider story phases can be split across contributors if edits to `packages/pse-edge/src/provider.ts` are coordinated

---

## Parallel Example: Foundational Parsers

```bash
Task: "T008 [P] Implement the company list parser in packages/pse-edge/src/parsers/company-list.ts using packages/pse-data/search.html"
Task: "T010 [P] Implement the stock data parser in packages/pse-edge/src/parsers/stock-data.ts using packages/pse-data/stockData.html"
Task: "T012 [P] Implement the company info parser in packages/pse-edge/src/parsers/company-info.ts using packages/pse-data/company_information.html"
Task: "T014 [P] Add the historical response fixture in packages/pse-data/disclosure-cht.json and implement the historical prices parser in packages/pse-edge/src/parsers/historical-prices.ts using that fixture"
```

## Parallel Example: Parser Tests

```bash
Task: "T009 [P] Add fixture-backed Vitest coverage for the company list parser in packages/pse-edge/tests/company-list.test.ts using packages/pse-data/search.html"
Task: "T011 [P] Add fixture-backed Vitest coverage for the stock data parser in packages/pse-edge/tests/stock-data.test.ts using packages/pse-data/stockData.html"
Task: "T013 [P] Add fixture-backed Vitest coverage for the company info parser in packages/pse-edge/tests/company-info.test.ts using packages/pse-data/company_information.html"
Task: "T015 [P] Add fixture-backed Vitest coverage for the historical prices parser in packages/pse-edge/tests/historical-prices.test.ts using packages/pse-data/disclosure-cht.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate `getCompanyList()` independently

### Incremental Delivery

1. Complete Setup + Foundational
2. Deliver `getCompanyList()` and validate paginated aggregation
3. Deliver `getStockData()` and `getCompanyInfo()` and validate first-security and logo behavior
4. Deliver `getHistoricalPrices()` and validate date/value normalization
5. Export the package, wire consumers, and run the final Vitest verification

### Parallel Team Strategy

1. One contributor handles T005-T007
2. Up to four contributors implement parser/test pairs T008-T015 in parallel
3. Provider methods T016-T022 can then be split by user story
4. One contributor finalizes exports, dependency wiring, and verification

---

## Notes

- All tasks follow the required checkbox + task ID + optional `[P]` + optional story label + exact file path format
- No database write tasks are included because the provider is read-only
- No Lambda job tasks are included because Lambda integration is out of scope
