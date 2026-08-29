<div align="center">

# DataForge

### Turn messy CSV files into clean, system-ready data.

![React](https://img.shields.io/badge/React-18-111827?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-111827?style=flat-square&logo=typescript&logoColor=3178C6)
![Vite](https://img.shields.io/badge/Vite-8-111827?style=flat-square&logo=vite&logoColor=646CFF)
![Tests](https://img.shields.io/badge/Tests-Vitest-111827?style=flat-square&logo=vitest&logoColor=6E9F18)
![Privacy](https://img.shields.io/badge/Data-local_only-35D399?style=flat-square)

[**Open the live app →**](https://rickythakar.github.io/dataforge/)

</div>

DataForge is a privacy-first data preparation workspace for operations teams. Upload a CSV, understand its quality, map it to a destination schema, apply safe repairs, preview the result, and export a clean file—without sending the data to a server.

## Live demo

Visit **[rickythakar.github.io/dataforge](https://rickythakar.github.io/dataforge/)** and select **Load sample data** to explore the complete workflow without providing a file.

## Why this exists

Operational imports often fail for small, preventable reasons: inconsistent headers, missing required values, malformed dates, duplicate identifiers, and whitespace nobody can see. Fixing those problems by hand is slow and difficult to audit.

DataForge brings the whole preparation loop into one focused interface:

1. **Import** a local CSV file or use synthetic sample data.
2. **Profile** every field for type, completeness, and uniqueness.
3. **Validate** values with row-level, actionable explanations.
4. **Map** source headers to the destination system's schema.
5. **Repair** safe formatting problems while preserving the original input.
6. **Export** a correctly escaped, system-ready CSV.

## Product highlights

- Local-only processing with browser `FileReader` and `Blob` APIs
- Drag-and-drop CSV import with structural error handling
- Automatic field-type inference for text, email, number, and date data
- Required, unique, email, number, and strict ISO-date validation rules
- Column mapping that keeps validation and repair behavior in sync
- Suggested repairs for whitespace, email casing, and missing numeric defaults
- Responsive data-quality dashboard with flagged-cell context
- Standards-compliant CSV parsing and export, including quotes and multiline values
- Synthetic sample workspace for a zero-setup product tour

## Architecture

```text
CSV input
   │
   ▼
parseCsv ──► normalized rows ──► profileDataset
                                  │
                                  ├──► validateDataset ──► issue model
                                  ├──► mapColumns ───────► destination schema
                                  └──► applyRepairs ─────► reviewed rows
                                                               │
                                                               ▼
                                                           exportCsv
```

The core data functions are pure and framework-independent. React owns workflow state and rendering; parsing, profiling, validation, mapping, repair, and export remain independently testable.

## Getting started

DataForge requires Node.js 20.19 or newer. The repository includes an `.nvmrc` for Node 22.12.

```bash
nvm use
npm install
npm run dev
```

Then open the local address shown by Vite and select **Load sample data** for the complete demo flow.

## Quality checks

```bash
npm test       # unit and component tests
npm run build  # TypeScript and production bundle
npm audit      # dependency audit
```

The test suite covers CSV edge cases, data profiling, validation, immutable repairs, column mapping, onboarding, workspace metrics, and cross-feature regressions.

## Project structure

```text
src/
├── data/              # synthetic demo fixture and rules
├── lib/
│   ├── csv.ts         # import and export boundary
│   └── dataforge.ts   # profile, validation, mapping, and repair engine
├── App.tsx            # product workflow and accessible interface
├── styles.css         # responsive visual system
└── *.test.ts(x)       # behavioral specifications
```

## Privacy

DataForge does not upload files, use analytics, persist imported content, or require an account. All processing occurs in the active browser tab. The included demo records are fictional.

## Roadmap

- Configurable validation-rule builder
- Repair history with undo and before/after diffing
- Reusable destination-schema templates
- Excel workbook import and export
- Shareable validation reports that contain no source data
