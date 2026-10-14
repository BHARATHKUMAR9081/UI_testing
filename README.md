# Rapid24 UI Testing Framework

Playwright + TypeScript automated UI suite for the Rapid24 workspace, with a 77-case Master QA workbook (`Master_UI_Testing_Framework_Rapid24.xlsx`, 21 columns) generated from live runs.

## Setup

```bash
npm install
cp .env.example .env   # then fill in real credentials — never commit .env
```

## Run

```bash
npx playwright test --project=chromium        # full suite (sole runner: it cleans test-results/ on start)
npx playwright test tests/login/login.spec.ts --project=chromium --headed --output=/tmp/opencode/solo  # watch a single spec without wiping shared evidence
npx tsx create-master-excel.ts                # regenerate the Master workbook from test-results/
```

## Layout

- `tests/` — specs by module (`login`, `home`, `chat`, `agents`, `skills`, `models`, `integrations`, `automations`, `settings`) + `helpers.ts`
- `excel-reporter.ts` — per-run Excel reporter (`test-results.xlsx`)
- `create-master-excel.ts` — Master workbook generator (exact `searchKey` per case must substring-match its result folder)
- `evidence-viewer.ts` — screenshot/video evidence pages linked from the workbook
- `test-results/`, `playwright-report/`, `.env` — generated/local only, never committed
