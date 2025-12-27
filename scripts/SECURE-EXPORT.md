# Secure Export with Steganographic Watermarking

This script embeds **multiple layers of invisible watermarks** deep within your exported data, making them nearly impossible to detect or remove without destroying the data.

## 🔐 Watermark Layers

### 1. **Zero-Width Unicode Characters** (Invisible)
Watermark data is encoded using zero-width Unicode characters (`U+200B`, `U+200C`, `U+200D`) embedded directly in text fields:
- Inserted into comments, video IDs, and other string fields
- Completely invisible to human readers
- Survives copy/paste operations
- Cannot be removed by simple text cleaning

**Example**: The string "Hello" might actually be "Hel\u200B\u200C\u200D\u200Blo" with hidden data between characters.

### 2. **Distributed Cryptographic Fingerprints**
A SHA-256 hash is generated from your identity + export ID + timestamp, then split into fragments and distributed across records:
- Each record contains a different fragment in `_recordHash` field
- Fragments can be reassembled to prove ownership
- Cryptographically secure - cannot be forged
- Looks like normal database metadata

### 3. **Hidden Metadata Fields**
Additional fields that appear to be legitimate database/system fields:
- `_recordHash`: Database record hash (actually: fingerprint fragment)
- `_syncId`: Sync identifier (actually: encoded export ID)
- `_checksum`: Data integrity check (actually: fingerprint prefix)
- `version`, `schema`, `_txId`, `_dataHash` in JSON exports

These fields blend in naturally with the data structure.

### 4. **Timing Variations**
Imperceptible microsecond-level variations added to `labelingTimeMs`:
- Based on export ID cryptographic derivation
- Adds 0.001-0.009 ms variation (undetectable in practice)
- Creates a unique timing signature across all records
- Cannot be removed without knowing the pattern

### 5. **Verification File**
A separate `.verification-*.json` file is generated containing:
- Export ID
- Complete cryptographic fingerprint
- Hash fragments for verification
- Timestamp and record count

**Keep this file secure** - it's your proof of ownership!

## 🎯 Usage

### Secure Export (Recommended)
```bash
# JSON with steganographic watermarking
pnpm export:json:secure

# CSV with steganographic watermarking
pnpm export:csv:secure
```

### Basic Export (Visible watermark only)
```bash
# For reference or less sensitive data
pnpm export:json
pnpm export:csv
```

## 📦 Output Files

### JSON Export
```
exports/
├── annotations-1705315845123.json          # Main export file
└── .verification-1705315845123.json        # Proof of ownership (KEEP SECRET)
```

**JSON Structure**:
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
      "_recordHash": "a7f3c9d2",              // Hidden: Fragment 1
      "_syncId": "sync-l7x8m9n",              // Hidden: Export ID part
      "_checksum": "a7f3c9d2e8b1f4a6",        // Hidden: Fingerprint prefix
      ...
    }
  ]
}
```

### CSV Export
```
exports/
├── annotations-1705315845123.csv           # Main export file
└── .verification-1705315845123.json        # Proof of ownership (KEEP SECRET)
```

**CSV Structure**:
Headers include three watermark columns that look like system metadata:
- `Record Hash` - Contains fingerprint fragments
- `Sync ID` - Contains encoded export ID
- `Checksum` - Contains fingerprint prefix

Plus invisible Unicode characters embedded in text fields.

## 🔍 Verification

To verify ownership of an exported file, you can:

1. **Extract the hidden fingerprint**:
   - Combine `_recordHash` values from all records
   - Check `_dataHash` field (JSON) or `Record Hash` column (CSV)

2. **Check the verification file**:
   - Compare fingerprint with `.verification-*.json`
   - Verify export ID fragments

3. **Detect invisible characters**:
   - Count Unicode codepoints vs visible characters
   - Zero-width chars will increase byte count

Example verification script concept:
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

## 🛡️ Security Benefits

### Why This Works

1. **Multi-layered Defense**:
   - Even if someone removes visible watermarks, invisible layers remain
   - Multiple independent markers must all be removed
   - Removing all watermarks requires intimate knowledge of the system

2. **Plausible Deniability for Fields**:
   - `_recordHash`, `_syncId`, `_checksum` look like legitimate database fields
   - Most users won't question or remove "system" metadata
   - Even sophisticated users may not recognize them as watermarks

3. **Cryptographically Secure**:
   - SHA-256 fingerprints cannot be forged or reverse-engineered
   - Each export has a unique, verifiable signature
   - Mathematical proof of ownership

4. **Invisible Yet Persistent**:
   - Zero-width characters are invisible but survive text operations
   - Copy/paste, reformatting, and most text processing preserves them
   - Only intentional Unicode normalization would remove them

5. **Distributed Design**:
   - No single point of removal
   - Watermark fragments spread across all records
   - Partial data leaks still contain watermarks

### Attack Resistance

| Attack Type | Defense |
|------------|---------|
| Manual editing | Invisible chars remain, timing variations persist |
| CSV/JSON reformatting | Hidden fields preserved, invisible chars survive |
| Field deletion | Multiple redundant markers across records |
| Data sampling | Each record independently watermarked |
| Unicode normalization | Still have timing variations + hidden fields |
| Field renaming | Fingerprint fragments still present in values |

## ⚠️ Important Notes

### DO:
- ✅ Keep `.verification-*.json` files secure and backed up
- ✅ Store verification files separately from exports
- ✅ Document export IDs for your records
- ✅ Use secure export for all sensitive data

### DON'T:
- ❌ Share verification files with recipients
- ❌ Commit verification files to git (they're in `.gitignore`)
- ❌ Delete verification files (you'll lose proof of ownership)
- ❌ Share export IDs publicly

## 🔧 Customization

Edit `scripts/export-annotations-secure.ts` to customize:

### Change Watermark Identity
```typescript
const WATERMARK = {
  copyright: "© 2025 Your Name. All Rights Reserved.",
  owner: "Your Name",
  // ... other fields
};
```

### Adjust Timing Variation
```typescript
// Currently adds 0.001-0.009 ms variation
const variation = parseInt(exportId.substring(7, 10), 36) % 10;
watermarked.labelingTimeMs = annotation.labelingTimeMs + variation / 1000;

// Make it even smaller (more subtle):
watermarked.labelingTimeMs = annotation.labelingTimeMs + variation / 10000;
```

### Add More Hidden Fields
```typescript
interface WatermarkedAnnotation extends ExportAnnotation {
  _recordHash?: string;
  _syncId?: string;
  _checksum?: string;
  _customField?: string;  // Add your own
}
```

## 📊 Example Verification Flow

If someone claims your data as their own:

1. **Request the file** they claim is theirs
2. **Check for your watermarks**:
   - Look for invisible Unicode characters in text fields
   - Check for `_recordHash`, `_syncId`, `_checksum` fields
   - Extract the cryptographic fingerprint
3. **Compare with your verification file**:
   - Match the fingerprint
   - Verify export ID fragments
   - Check timestamp consistency
4. **Mathematical proof**: SHA-256 fingerprint proves ownership beyond doubt

## 📚 Technical Details

### Zero-Width Encoding Algorithm
Each character is converted to 8-bit binary, then encoded using zero-width characters:
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
Invisible watermarks are inserted at position `⌊length × φ⌋` where φ = 0.618 (golden ratio).
This creates a consistent but non-obvious insertion point.

## 🎓 Research References

This implementation is based on research in:
- Digital watermarking and steganography
- Unicode-based text watermarking
- Cryptographic fingerprinting
- Information hiding in databases

## 🔒 Legal Protection

The combination of:
1. Invisible Unicode watermarks (technical evidence)
2. Cryptographic fingerprints (mathematical proof)
3. Distributed markers (robust against tampering)
4. Verification files (provable ownership)

...provides **strong legal protection** for your intellectual property.

In case of disputes, you can demonstrate:
- **Possession**: You have the verification files
- **Authentication**: Cryptographic fingerprints prove the data came from your export
- **Integrity**: Watermarks show the data hasn't been significantly altered
- **Timing**: Export timestamps establish when the data was in your possession
