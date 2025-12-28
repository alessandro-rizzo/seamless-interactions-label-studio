# Annotation Export Guide

Complete guide to exporting annotation data with watermarking and IP protection.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Export Options Comparison](#export-options-comparison)
- [Basic Export](#basic-export)
- [Secure Export](#secure-export)
- [Usage Examples](#usage-examples)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Legal Protection](#legal-protection)

## Overview

This project includes two export scripts for annotation data:

1. **Basic Export** - Simple exports with visible watermarks (fast, for internal use)
2. **Secure Export** - Advanced exports with invisible steganographic watermarks (for sharing)

Both scripts export all annotations with user information, timestamps, and copyright protection. The secure export adds multiple layers of invisible, cryptographically-secure watermarks that are nearly impossible to remove.

## Quick Start

### For Internal Backups (Basic Export)

```bash
# Export as JSON
pnpm export:json

# Export as CSV
pnpm export:csv
```

### For External Sharing (Secure Export - Recommended)

```bash
# Export as JSON with invisible watermarks
pnpm export:json:secure

# Export as CSV with invisible watermarks
pnpm export:csv:secure
```

## Export Options Comparison

| Feature                | Basic Export             | Secure Export              |
| ---------------------- | ------------------------ | -------------------------- |
| **Visibility**         | Visible watermark header | Hidden + Visible layers    |
| **Removal Difficulty** | Easy to remove           | Nearly impossible          |
| **Proof of Ownership** | Timestamp only           | Cryptographic proof        |
| **Performance**        | Fast                     | Slightly slower            |
| **Use Case**           | Internal use, backups    | Sharing with third parties |
| **Detection**          | Obvious                  | Invisible to users         |
| **Verification File**  | No                       | Yes (keep secret!)         |

### Decision Guide

**Use Basic Export when:**
- Creating internal backups
- Migrating data between systems
- Running quick analysis
- Only you will access the data
- Speed is critical

**Use Secure Export when:**
- Sharing with collaborators
- Publishing research data
- Protecting valuable IP
- Need legal protection
- Want hidden tracking
- Data leaves your control

## Basic Export

### Overview

Simple, fast exports with visible watermark metadata. Best for internal use and backups.

### Features

- Visible copyright notices and licensing terms
- Unique export ID for tracking
- Export timestamp
- Support for JSON and CSV formats
- Fast execution

### Commands

```bash
# Using npm scripts (recommended)
pnpm export:json
pnpm export:csv

# Direct execution
pnpm tsx scripts/export-annotations.ts json
pnpm tsx scripts/export-annotations.ts csv
```

### Output Format

#### JSON Structure

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
  "data": [
    {
      "id": "cm71g8h0k00022jtzaxn9y1xc",
      "videoId": "V00_S0644_I00000129",
      "speaker1Label": "Morph A",
      "speaker2Label": "Morph B",
      "speaker1Prosody": ["low_pitch_variance", "rising_terminal"],
      "userEmail": "alessandro.rizzo@example.com",
      "username": "alessandro.rizzo",
      ...
    }
  ]
}
```

#### CSV Structure

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
ID,Video ID,Vendor ID,...,Username,User Email
cm71...,V00_S0644_I00000129,0,...,alessandro.rizzo,alessandro.rizzo@example.com
```

### Pros & Cons

**Pros:**
- Simple and straightforward
- Fast execution
- Easy to verify visually
- Legal deterrent (visible copyright)

**Cons:**
- Easy to remove (delete header lines)
- No hidden markers
- Limited proof of ownership

## Secure Export

### Overview

Advanced exports with **multiple layers of invisible watermarks** deep within the data, making them nearly impossible to detect or remove without destroying the data.

### Features

5 layers of invisible watermarking:

1. **Zero-Width Unicode Characters** (invisible)
2. **Distributed Cryptographic Fingerprints** (SHA-256)
3. **Hidden Metadata Fields** (blend in naturally)
4. **Timing Variations** (imperceptible)
5. **Verification File** (proof of ownership)

### Commands

```bash
# Using npm scripts (recommended)
pnpm export:json:secure
pnpm export:csv:secure

# Direct execution
pnpm tsx scripts/export-annotations-secure.ts json
pnpm tsx scripts/export-annotations-secure.ts csv
```

### Watermark Layers Explained

#### 1. Zero-Width Unicode Characters

Invisible characters embedded directly in text fields:
- Uses `U+200B`, `U+200C`, `U+200D`
- Completely invisible to human readers
- Survives copy/paste operations
- Cannot be removed by simple text cleaning

Example: "Hello" might actually be "Hel\u200B\u200C\u200D\u200Blo"

#### 2. Distributed Cryptographic Fingerprints

SHA-256 hash generated from identity + export ID + timestamp:
- Split into fragments across all records
- Each record contains different fragment
- Cryptographically secure (cannot be forged)
- Looks like normal database metadata

#### 3. Hidden Metadata Fields

Fields that appear to be legitimate system metadata:
- `_recordHash`: Fingerprint fragment
- `_syncId`: Encoded export ID
- `_checksum`: Fingerprint prefix
- Blend in naturally with data structure

#### 4. Timing Variations

Microsecond-level variations in `labelingTimeMs`:
- 0.001-0.009 ms variation (imperceptible)
- Based on export ID derivation
- Creates unique signature
- Cannot be removed without knowing pattern

#### 5. Verification File

Separate `.verification-*.json` file containing:
- Export ID
- Complete cryptographic fingerprint
- Hash fragments for verification
- **Keep this file secure** - it's your proof of ownership!

### Output Format

#### JSON Structure

```json
{
  "version": "1.0",
  "schema": "annotations_v2",
  "exported": "2025-01-15T10:30:45.123Z",
  "recordCount": 42,
  "_txId": "tx-l7x8m9n-abc123x",              // Hidden: Export ID fragment
  "_dataHash": "a7f3c9d2e8b1f4...",           // Hidden: Full fingerprint
  "records": [
    {
      "id": "cm71g8h...",
      "videoId": "V00_S0644...\u200B\u200C",  // Hidden: Invisible chars
      "speaker1Comments": "Test\u200D...",    // Hidden: Invisible chars
      "_recordHash": "a7f3c9d2",              // Hidden: Fragment
      "_syncId": "sync-l7x8m9n",              // Hidden: Export ID
      "_checksum": "a7f3c9d2e8b1f4a6",        // Hidden: Fingerprint
      ...
    }
  ]
}
```

#### CSV Structure

Headers include three watermark columns:
- `Record Hash` - Fingerprint fragments
- `Sync ID` - Encoded export ID
- `Checksum` - Fingerprint prefix

Plus invisible Unicode characters embedded in text fields.

#### Files Created

```
exports/
├── annotations-1705315845123.json          # Main export (share this)
└── .verification-1705315845123.json        # Proof of ownership (KEEP SECRET!)
```

### Security Benefits

**Multi-layered Defense:**
- Even if visible watermarks removed, invisible layers remain
- Multiple independent markers must all be removed
- Requires intimate knowledge of system to remove all

**Plausible Deniability:**
- Hidden fields look like legitimate database metadata
- Most users won't question "system" fields

**Cryptographically Secure:**
- SHA-256 fingerprints cannot be forged
- Each export has unique, verifiable signature
- Mathematical proof of ownership

**Attack Resistance:**

| Attack Type           | Defense                                           |
| --------------------- | ------------------------------------------------- |
| Manual editing        | Invisible chars remain, timing variations persist |
| CSV/JSON reformatting | Hidden fields preserved, invisible chars survive  |
| Field deletion        | Multiple redundant markers across records         |
| Data sampling         | Each record independently watermarked             |
| Unicode normalization | Still have timing variations + hidden fields      |

### Important Notes

**DO:**
- Keep `.verification-*.json` files secure and backed up
- Store verification files separately from exports
- Document export IDs for your records
- Use secure export for all sensitive data

**DON'T:**
- Share verification files with recipients
- Commit verification files to git (they're in `.gitignore`)
- Delete verification files (you'll lose proof of ownership)
- Share export IDs publicly

## Usage Examples

### Maximum Protection Workflow

```bash
# 1. Export with full security
pnpm export:json:secure

# 2. Files created:
#    - exports/annotations-1705315845123.json        (share this)
#    - exports/.verification-1705315845123.json      (KEEP SECRET!)

# 3. Back up verification file securely
cp exports/.verification-*.json ~/secure-backups/

# 4. Share the main export file
#    (it's now watermarked with invisible markers)
```

### Quick Backup Workflow

```bash
# Simple and fast
pnpm export:json

# No verification file needed
# Clear visible watermark for legal protection
```

## Exported Data Fields

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
- **User Email**: Full email address of annotator
- **Username**: Part before @ in email

## Verification

### Verifying Secure Export Ownership

If someone shares your data without permission:

1. **Request their file**
2. **Check for your watermarks**:
   - Look for invisible Unicode characters
   - Check for `_recordHash`, `_syncId`, `_checksum` fields
   - Extract the cryptographic fingerprint
3. **Compare with verification file**:
   - Match the fingerprint
   - Verify export ID fragments
   - Check timestamp consistency
4. **Result**: Mathematical proof of ownership

### Example Verification Code

```javascript
// Check if string contains invisible watermark
function hasInvisibleWatermark(text) {
  return text.includes('\u200B') ||
         text.includes('\u200C') ||
         text.includes('\u200D');
}

// Verify fingerprint
function verifyFingerprint(records, verificationFile) {
  const fragments = records.map(r => r._recordHash);
  const reconstructed = fragments.join('');
  return reconstructed === verificationFile.fingerprint;
}
```

### Basic Export Verification

1. Check for export ID in file
2. Compare timestamps
3. Legal case based on visible watermark

**Secure export provides stronger evidence!**

## Troubleshooting

### "Cannot find module 'csv-writer'"

```bash
pnpm install
```

### "Database connection failed"

Ensure your `.env` file has a valid `DATABASE_URL`.

### "No annotations found"

The database may be empty. Create some annotations first.

### Verification file not created

Make sure you're using the secure export commands (`export:json:secure` or `export:csv:secure`).

## Database Connection

Scripts use your existing Prisma configuration:
- Reads from `DATABASE_URL` in `.env`
- Connects to same database as application
- No additional configuration needed

## Output Directory

Files are saved to `exports/` directory with timestamped filenames:
- `exports/annotations-export-1705315845123.json`
- `exports/annotations-export-1705315845123.csv`

The `exports/` directory is automatically excluded from git via `.gitignore`.

## Customization

### Change Watermark Identity

Edit `scripts/export-annotations.ts` or `scripts/export-annotations-secure.ts`:

```typescript
const WATERMARK = {
  copyright: "© 2025 Your Name. All Rights Reserved.",
  license: "Your custom license terms...",
  trademark: "Your Trademark™",
  owner: "Your Name",
  contact: "Your contact info",
};
```

### Adjust Timing Variation (Secure Export)

```typescript
// Currently adds 0.001-0.009 ms variation
const variation = parseInt(exportId.substring(7, 10), 36) % 10;
watermarked.labelingTimeMs = annotation.labelingTimeMs + variation / 1000;

// Make it even smaller (more subtle):
watermarked.labelingTimeMs = annotation.labelingTimeMs + variation / 10000;
```

## Legal Protection

The combination of:
1. Invisible Unicode watermarks (technical evidence)
2. Cryptographic fingerprints (mathematical proof)
3. Distributed markers (robust against tampering)
4. Verification files (provable ownership)

...provides **strong legal protection** for your intellectual property.

In case of disputes, you can demonstrate:
- **Possession**: You have the verification files
- **Authentication**: Cryptographic fingerprints prove data origin
- **Integrity**: Watermarks show data hasn't been altered
- **Timing**: Export timestamps establish when data was in your possession

### Legal Notice

**IMPORTANT**: The exported data is confidential and proprietary. Unauthorized sharing, distribution, or reproduction is prohibited. Each export includes unique tracking and watermarking for IP protection.

Both exports include copyright notice and licensing terms. The secure export provides **additional technical protection** that makes unauthorized use traceable and provable in legal proceedings.

**Recommendation**: Use secure export for maximum IP protection.

## Best Practices

1. **Always keep verification files** from secure exports
   - Store separately from exports
   - Back up to secure location
   - Never share with data recipients

2. **Document your exports**
   - Note the export ID
   - Record who received the data
   - Keep a log of timestamps

3. **Use secure export by default** for anything leaving your machine
   - Better safe than sorry
   - Invisible markers don't hurt

4. **Test your watermarks**
   ```bash
   # Export a test file
   pnpm export:json:secure

   # Try to find the watermarks
   cat exports/annotations-*.json | grep -P '[\u200B-\u200D]'
   ```

## Security Recommendations

1. **Do not commit exports to version control** - excluded via .gitignore
2. **Store exports in a secure location** with restricted access
3. **Use encrypted storage** for long-term archival
4. **Track Export IDs** - each export has unique ID for auditing
5. **Limit access** - only run scripts on secure, trusted machines
6. **Verify watermarks** - always check exports contain proper watermarking

## Technical Details

### Zero-Width Encoding Algorithm

Each character converted to 8-bit binary, then encoded using zero-width characters:
- `1` → Zero-width joiner (`\u200D`)
- `0` → Zero-width non-joiner (`\u200C`)
- Characters separated by zero-width space (`\u200B`)

Example: `"A"` (ASCII 65 = `01000001`) becomes:
```
\u200C\u200D\u200C\u200C\u200C\u200C\u200C\u200D
```

### Fingerprint Generation

```
Input: OWNER:EXPORT_ID:TIMESTAMP
Algorithm: SHA-256
Output: 64-character hex string
Distribution: Split into 4 fragments, distributed across records
```

### Golden Ratio Insertion

Invisible watermarks inserted at position `⌊length × φ⌋` where φ = 0.618 (golden ratio). Creates consistent but non-obvious insertion point.

## Related Scripts

- `scripts/export-annotations.ts` - Basic export implementation
- `scripts/export-annotations-secure.ts` - Secure export implementation

## Research References

This implementation is based on research in:
- Digital watermarking and steganography
- Unicode-based text watermarking
- Cryptographic fingerprinting
- Information hiding in databases
