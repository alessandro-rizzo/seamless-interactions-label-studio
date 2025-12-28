# Test Export Dataset Generator

This script creates representative test annotations and exports them for training pipeline development.

## Overview

The test dataset includes:

- **5 unique videos** with real video ID formats from the Seamless Interactions dataset
- **5 annotations** showcasing diverse interaction patterns across all 11 facets
- Representative signals from the complete annotation ontology (98 total signals)

## Interaction Patterns Included

The test annotations represent diverse interaction dynamics:

1. **High Engagement vs Reserved** - One speaker animated, other more thoughtful
2. **Balanced Collaborative** - Both speakers equally engaged with alignment behaviors
3. **Asymmetric Power Dynamic** - One speaker dominant, other uncertain/uncomfortable
4. **Task-Focused Technical** - Both speakers formal with minimal affect
5. **Storytelling & Listening** - Animated narrator with active listener

## Usage

### Export to JSON

```bash
pnpm tsx scripts/create-test-export.ts json
```

Creates a JSON file with metadata and structured annotation data:

```json
{
  "metadata": {
    "exportType": "test-export",
    "exportDate": "2025-12-28T...",
    "totalRecords": 5,
    "description": "Representative test annotations..."
  },
  "data": [...]
}
```

### Export to CSV

```bash
pnpm tsx scripts/create-test-export.ts csv
```

Creates a CSV file with:

- All annotation fields as columns
- Array fields (facet signals) as semicolon-separated values
- Compatible with spreadsheet software and pandas

### Keep Test Data in Database

```bash
pnpm tsx scripts/create-test-export.ts json --keep-data
pnpm tsx scripts/create-test-export.ts csv --keep-data
```

By default, test data is automatically deleted after export. Use `--keep-data` to preserve it in the database.

## Output Location

Exports are saved to the `exports/` directory with timestamp:

```
exports/test-export-2025-12-28T10-30-45.json
exports/test-export-2025-12-28T10-30-45.csv
```

## Data Structure

Each annotation includes:

### Video Identifiers

- `videoId`, `vendorId`, `sessionId`, `interactionId`
- `speaker1Id`, `speaker2Id`, `speaker1Label`, `speaker2Label`

### Annotation Quality

- `speaker1Confidence`, `speaker2Confidence` (1-5 scale)
- `speaker1Comments`, `speaker2Comments`
- `labelingTimeMs`

### Behavioral Signals (11 Facets per Speaker)

- **Prosody** - Acoustic characteristics of speech
- **Lexical Choice** - Word and phrase selection patterns
- **Turn Taking** - Conversational floor management
- **Gaze** - Eye direction and movement
- **Facial Expression** - Visible facial movements
- **Gesture** - Hand and arm movements
- **Posture** - Whole-body orientation
- **Affect Regulation** - Expressive output modulation
- **Interactional Role** - Behavioral positioning
- **Timing & Latency** - Response timing characteristics
- **Repair Behavior** - Corrections and restarts

### Metadata

- `userEmail`, `username` (annotator information)
- `createdAt`, `updatedAt` (timestamps)

## Video IDs Included

Real video IDs from the Seamless Interactions dataset:

- `V00_S0644_I00000129` (improvised, dev split)
- `V00_S0001_I00000001` (improvised, train split)
- `V00_S0001_I00000002` (naturalistic, dev split)
- `V00_S0644_I00000130` (improvised, dev split)
- `V00_S0001_I00000003` (improvised, train split)

## Notes for Researchers

1. **Array Fields in CSV**: Facet signals are exported as semicolon-separated strings (e.g., `"smile; brow_raise"`)
2. **Signal IDs**: All signal IDs match those defined in `lib/annotation-ontology.ts`
3. **Confidence Scores**: Range from 1 (low) to 5 (high confidence)
4. **Labeling Time**: Measured in milliseconds, represents annotation duration
5. **Comments**: Free-text notes from annotators about each speaker's behavior

## Ontology Reference

For complete signal definitions and descriptions, see:

- `lib/annotation-ontology.ts` - Full ontology with 11 facets and 98 signals
- `scripts/EXPORT-GUIDE.md` - Export formats and security considerations
