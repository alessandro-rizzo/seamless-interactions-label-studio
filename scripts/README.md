# Export Annotations Script

Secure offline script for exporting annotation data with embedded watermarks for IP protection.

## Overview

This script connects directly to your database and exports all annotations with:
- ✅ User information (email, username)
- ✅ All annotation data including category annotations
- ✅ Embedded watermarks with copyright, trademark, and licensing terms
- ✅ Unique export ID for tracking
- ✅ Export timestamp
- ✅ Support for JSON and CSV formats

## Security Features

### Watermark Metadata
Every export includes:
- **Copyright Notice**: © 2025 Alessandro Rizzo. All Rights Reserved.
- **Trademark**: SeamlessInteractions™ Annotation Data
- **License Terms**: Confidential and proprietary notice
- **Export ID**: Unique identifier for each export
- **Export Date**: ISO timestamp of export
- **Record Count**: Total number of annotations

### JSON Format
The watermark appears as a top-level `watermark` object:
```json
{
  "watermark": {
    "copyright": "© 2025 Alessandro Rizzo. All Rights Reserved.",
    "license": "CONFIDENTIAL AND PROPRIETARY - ...",
    "trademark": "SeamlessInteractions™ Annotation Data",
    "owner": "Alessandro Rizzo",
    "exportId": "EXPORT-L7X8M9N-ABC123X",
    "exportDate": "2025-01-15T10:30:45.123Z",
    "totalRecords": 42,
    "contact": "For licensing inquiries, contact the owner."
  },
  "data": [...]
}
```

### CSV Format
The watermark appears as comment lines at the top of the file:
```csv
# SeamlessInteractions™ Annotation Data
# © 2025 Alessandro Rizzo. All Rights Reserved.
# CONFIDENTIAL AND PROPRIETARY - This data is the exclusive property...
# Owner: Alessandro Rizzo
# Export ID: EXPORT-L7X8M9N-ABC123X
# Export Date: 2025-01-15T10:30:45.123Z
# Total Records: 42
# For licensing inquiries, contact the owner.
#
ID,Video ID,Vendor ID,...
```

## Usage

### Using npm scripts (recommended):
```bash
# Export as JSON
pnpm export:json

# Export as CSV
pnpm export:csv
```

### Direct execution:
```bash
# Export as JSON
pnpm tsx scripts/export-annotations.ts json

# Export as CSV
pnpm tsx scripts/export-annotations.ts csv
```

## Output

Files are saved to the `exports/` directory with timestamped filenames:
- `exports/annotations-export-1705315845123.json`
- `exports/annotations-export-1705315845123.csv`

The `exports/` directory is automatically excluded from git via `.gitignore`.

## Exported Fields

### Core Annotation Data
- ID, Video ID, Vendor ID, Session ID, Interaction ID
- Speaker IDs, Labels, Confidence levels
- Comments (grounded theory memos)
- Labeling time in milliseconds
- Created/Updated timestamps

### Category Annotations (22 fields)
For each speaker (1 & 2):
- Prosody
- Lexical Choice
- Turn Taking
- Gaze
- Facial Expression
- Gesture
- Posture
- Affect Regulation
- Interactional Role
- Timing & Latency
- Repair Behavior

**Note**: In CSV format, arrays are joined with "; " separator.

### User Information
- **User Email**: Full email address of the annotator
- **Username**: Part before @ in email (e.g., "alessandro.rizzo")

## Example Output

### JSON Structure
```json
{
  "watermark": { ... },
  "data": [
    {
      "id": "cm71g8h0k00022jtzaxn9y1xc",
      "videoId": "V00_S0644_I00000129",
      "vendorId": 0,
      "sessionId": 644,
      "interactionId": 129,
      "speaker1Label": "Morph A",
      "speaker2Label": "Morph B",
      "speaker1Prosody": ["low_pitch_variance", "rising_terminal"],
      "speaker2LexicalChoice": ["hedging_terms", "certainty_terms"],
      "userEmail": "alessandro.rizzo@example.com",
      "username": "alessandro.rizzo",
      ...
    }
  ]
}
```

### CSV Structure
```csv
# [Watermark comments]
ID,Video ID,Vendor ID,...,Username,User Email
cm71...,V00_S0644_I00000129,0,...,alessandro.rizzo,alessandro.rizzo@example.com
```

## Database Connection

The script uses your existing Prisma configuration and environment variables:
- Reads from `DATABASE_URL` in your `.env` file
- Connects to the same database as your application
- No additional configuration needed

## Security Recommendations

1. **Do not commit exports to version control** - they're excluded via .gitignore
2. **Store exports in a secure location** with restricted access
3. **Use encrypted storage** for long-term archival
4. **Track Export IDs** - each export has a unique ID for auditing
5. **Limit access** - only run this script on secure, trusted machines
6. **Verify watermarks** - always check that exports contain proper watermark metadata

## Troubleshooting

### "Cannot find module 'csv-writer'"
```bash
pnpm install
```

### "Database connection failed"
Ensure your `.env` file has a valid `DATABASE_URL`.

### "No annotations found"
The database may be empty. Create some annotations first.

## Customization

To customize the watermark, edit `scripts/export-annotations.ts`:

```typescript
const WATERMARK = {
  copyright: "© 2025 Your Name. All Rights Reserved.",
  license: "Your custom license terms...",
  trademark: "Your Trademark™",
  owner: "Your Name",
  contact: "Your contact info",
};
```

## Legal Notice

**⚠️ IMPORTANT**: The exported data is confidential and proprietary. Unauthorized sharing, distribution, or reproduction is prohibited. Each export includes a unique tracking ID and watermark for IP protection.
