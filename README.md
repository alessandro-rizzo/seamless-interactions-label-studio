# Seamless Interactions Label Studio

A professional web-based annotation tool for labeling speaker morphs in the [Seamless Interaction Dataset](https://github.com/facebookresearch/seamless_interaction). Built for observational coding exercises with synchronized video playback, timing tracking, and comprehensive statistics.

## Features

- 📋 **Browse All Videos** - See all 64,000+ videos available in the dataset (fetched from GitHub)
- 📥 **On-Demand Downloads** - Download specific videos directly from S3 (no Python required!)
- 🗑️ **Disk Management** - Delete videos from disk after annotation to save space
- 📹 **Synchronized Dual Video Player** - Watch both participants side-by-side with frame-perfect synchronization
- ⏱️ **Automatic Time Tracking** - Labeling time calculated from first video play to last morph selection
- ✅ **Progress Tracking** - Visual indicators showing completed vs. pending annotations
- 🏷️ **Binary Labeling** - Label each speaker as Morph A or Morph B
- 🎯 **Per-Speaker Confidence** - Individual confidence scoring for each speaker (1-5 scale)
- 💬 **Per-Speaker Comments** - Add individual observations and notes for each speaker
- 🧹 **Clear Annotations** - Delete annotation records with confirmation
- 📊 **Statistics Dashboard** - View morph distribution, completion rates, and time metrics
- 🔍 **Advanced Filtering** - Filter by download status, annotation status, and interaction type (improvised/naturalistic)
- 💾 **Persistent Storage** - SQLite database that survives app restarts
- 📤 **Export Options** - Download annotations as CSV or JSON
- 🎨 **Dark Mode UI** - Modern dark theme optimized for extended use
- ⚡ **Fast & Local** - Runs entirely on your machine

## Prerequisites

- **Node.js** 18+ ([install](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** package manager: `npm install -g pnpm`
- **Internet connection** (to fetch video list and download videos)

That's it! No Python required. Everything is fetched on-demand from S3.

## Quick Start

### 1. Install Dependencies

```bash
cd seamless-interactions-label-studio
pnpm install
```

### 2. Setup Database

```bash
pnpm prisma generate
pnpm prisma db push
```

### 3. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Labeling Workflow

1. **Browse Videos** - Click "Start Labeling" from the home page to see all available interactions
2. **Filter Videos** - Use filters to find specific videos:
   - Download status (all/downloaded/not downloaded)
   - Annotation status (all/annotated/not annotated)
   - Interaction type (all/improvised/naturalistic)
3. **Download Video** - Click "Download" to fetch the video on-demand from S3 (typically 30-50 MB)
4. **Watch & Analyze** - Both participant videos play in perfect sync with shared playback controls
5. **Start Timer** - Begin timing when you start analyzing the interaction
6. **Label Speakers** - Select Morph A or Morph B for each participant
7. **Set Confidence** - Use individual sliders for each speaker's confidence (1=low, 5=high)
8. **Add Comments** - Include per-speaker observations and notes (optional)
9. **Save** - Timer and video automatically stop when you save
10. **Clear Annotation** - Use "Clear Annotation" button to delete the record if needed
11. **Clean Up** - Delete the video from disk using the trash icon to save space

### Dashboard & Export

The home page shows:

- **Total Videos** - Downloaded videos as percentage of total dataset
- **Annotated Videos** - Completed annotations as percentage of downloaded
- **Labeled Speakers** - Total number of speakers annotated
- **Average Confidence** - Overall and per-speaker confidence metrics
- **Labeling Time** - Total and average time spent per video
- **Morph Distribution** - Visual breakdown of Morph A vs B proportions
- **Recent Annotations** - Latest 10 annotations with quick access

**Export Options:**
- Click "Export JSON" to download all annotations as JSON
- Click "Export CSV" to download all annotations as CSV

### Keyboard Navigation

- Use video player controls for play/pause and seeking
- Both videos stay synchronized automatically
- Timer start/stop is manual (button click)

## Project Structure

```
seamless-interactions-label-studio/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API routes
│   │   ├── annotations/          # Annotation CRUD operations
│   │   ├── download/             # Video download endpoint
│   │   ├── export/              # CSV/JSON export endpoint
│   │   ├── interactions/        # Remote dataset listing
│   │   └── video/               # Video streaming with range support
│   ├── videos/                  # Video list and labeling pages
│   │   └── [videoId]/           # Dynamic annotation page per video
│   ├── layout.tsx               # Root layout with header
│   ├── page.tsx                 # Dashboard with statistics
│   └── globals.css              # Tailwind styles
├── components/                   # React components
│   ├── labeling-form.tsx        # Annotation form with timer and controls
│   ├── labeling-form.test.tsx   # Component tests
│   ├── synchronized-video-player.tsx  # Dual video player with sync
│   ├── synchronized-video-player.test.tsx
│   ├── video-list.tsx           # Filterable video list with pagination
│   ├── video-list.test.tsx
│   ├── video-player.tsx         # Single video player component
│   └── video-player.test.tsx
├── e2e/                         # Playwright end-to-end tests
│   └── labeling-workflow.spec.ts  # Full labeling workflow test
├── lib/                         # Core utilities
│   ├── db.ts                   # Prisma client singleton
│   ├── dataset.ts              # Local dataset scanning
│   ├── dataset-remote.ts       # Remote dataset listing from GitHub
│   └── utils.ts                # Helper functions
├── prisma/                      # Database
│   ├── schema.prisma           # Database schema definition
│   └── dev.db                  # SQLite database (gitignored)
├── downloads/                   # Downloaded videos (gitignored)
├── jest.config.js              # Jest configuration
├── jest.setup.js               # Jest setup with mocks
├── playwright.config.ts        # Playwright configuration
└── package.json                 # Dependencies and scripts
```

## Database Schema

The `Annotation` model stores:

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier (CUID) |
| `videoId` | String | Video identifier (V{vendor}_S{session}_I{interaction}) - unique |
| `vendorId` | Int | Vendor ID from dataset |
| `sessionId` | Int | Session ID from dataset |
| `interactionId` | Int | Interaction ID from dataset |
| `speaker1Id` | String | Participant 1 ID (can be alphanumeric, e.g., "0799", "0299A") |
| `speaker2Id` | String | Participant 2 ID |
| `speaker1Label` | String | Morph label for speaker 1 |
| `speaker2Label` | String | Morph label for speaker 2 |
| `speaker1Confidence` | Int | Confidence score for speaker 1 (1-5) |
| `speaker2Confidence` | Int | Confidence score for speaker 2 (1-5) |
| `comments` | String | Optional comments |
| `labelingTimeMs` | Int | Time spent labeling (milliseconds) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

## Development

### Running Tests

**Unit Tests (Jest + React Testing Library)**
```bash
# Run all unit tests with coverage
pnpm test

# Watch mode
pnpm test:watch
```

**End-to-End Tests (Playwright)**
```bash
# Run e2e tests (starts dev server automatically)
pnpm test:e2e

# Run with UI mode for debugging
pnpm test:e2e:ui
```

The e2e test covers the complete labeling workflow:
- Landing on homepage and checking initial stats
- Navigating to videos list and downloading a video
- Playing video, selecting morphs, setting confidence, adding comments
- Saving annotation and verifying stats update
- Exporting JSON and CSV to verify data
- Cleanup (deleting annotation and downloaded video)

### Database Management

View/edit database directly:
```bash
pnpm prisma studio
```

Reset database:
```bash
rm prisma/dev.db
pnpm prisma db push
```

### Building for Production

```bash
pnpm build
pnpm start
```

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [SQLite](https://www.sqlite.org/) + [Prisma ORM](https://www.prisma.io/)
- **Testing**: [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## API Reference

### Annotations API

**GET /api/annotations**
- Returns all annotations ordered by creation date

**POST /api/annotations**
- Creates or updates an annotation
- Body: `{ videoId, vendorId, sessionId, interactionId, speaker1Id, speaker2Id, speaker1Label, speaker2Label, speaker1Confidence, speaker2Confidence, comments, labelingTimeMs }`

**DELETE /api/annotations?videoId={videoId}**
- Deletes an annotation by videoId

**DELETE /api/annotations?id={id}**
- Deletes an annotation by ID

### Download API

**POST /api/download**
- Downloads videos from S3
- Body: `{ fileId1, fileId2, label, split, batchIdx }`

**DELETE /api/download?fileId1={id1}&fileId2={id2}**
- Deletes downloaded videos from disk

### Export API

**GET /api/export?format={csv|json}**
- Downloads all annotations in specified format
- Returns file with download headers

### Video API

**GET /api/video?path={absolutePath}**
- Streams video file with range request support
- Validates path is within allowed directories
- Returns 206 Partial Content for seeking

### Interactions API

**GET /api/interactions**
- Returns list of all available interactions from dataset
- Includes download status for each video

## Troubleshooting

### Downloads are slow

Videos are typically 30-50 MB each and download directly from S3. Download speed depends on your internet connection. The app uses streaming downloads with progress indicators.

### Videos won't play

- Open browser console to check for errors
- Verify videos downloaded successfully
- Ensure videos are valid MP4 format
- Check that video API endpoint is accessible
- Try deleting and re-downloading the video

### Database errors

```bash
# Regenerate Prisma client
pnpm prisma generate

# Reset database (warning: deletes all data)
rm prisma/dev.db
pnpm prisma db push

# View database
pnpm prisma studio
```

### Build or type errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Rebuild
pnpm build
```

## Dataset Format

The app expects videos following this naming pattern:
```
V{vendor}_S{session}_I{interaction}_P{participant}.mp4
```

Example: `V00_S0644_I00000129_P0799.mp4`
- Vendor: 00 (with leading zeros preserved)
- Session: 0644
- Interaction: 00000129
- Participant: 0799 (can be alphanumeric like "0299A")

Videos are automatically grouped by interaction ID. Each interaction must have exactly 2 participant videos to be displayed.

## Performance Notes

- Videos are streamed directly from disk (not loaded into memory)
- Range requests enable seeking without full download
- SQLite provides fast local queries (<1ms for most operations)
- Server components pre-render where possible
- Production build optimizes bundle size
- Filelist cached for 24 hours to reduce GitHub API calls

## License

This tool is created for research purposes. The Seamless Interaction Dataset has its own license terms - please review at [github.com/facebookresearch/seamless_interaction](https://github.com/facebookresearch/seamless_interaction).

## Support

- Review this README for common issues
- Check the Seamless Interaction Dataset [documentation](https://github.com/facebookresearch/seamless_interaction)
- Inspect browser console for client-side errors
- Check terminal output for server-side errors
- Use `pnpm prisma studio` to inspect database state
