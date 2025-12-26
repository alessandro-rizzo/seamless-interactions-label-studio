# Seamless Interactions Label Studio

A professional web-based annotation tool for labeling speaker morphs in the [Seamless Interaction Dataset](https://github.com/facebookresearch/seamless_interaction). Built for observational coding exercises with synchronized video playback, timing tracking, and comprehensive statistics.

## Features

- 📊 **Unified Dashboard** - Stats and video list on one page with sticky header for efficient workflow
- 📋 **Browse All Videos** - See all 64,000+ videos available in the dataset
- 📹 **Synchronized Dual Video Player** - Watch both participants side-by-side with frame-perfect synchronization
- ✅ **Progress Tracking** - Visual indicators showing completed vs. pending annotations
- 🏷️ **Binary Labeling** - Label each speaker as Morph A or Morph B
- 🎯 **Per-Speaker Confidence** - Individual confidence scoring for each speaker (1-5 scale)
- 💬 **Per-Speaker Comments** - Add individual observations and notes for each speaker
- 🧹 **Clear Annotations** - Delete annotation records with confirmation
- 📈 **Live Statistics** - View morph distribution and completion metrics at the top of the page
- 🔍 **Advanced Filtering** - Filter by annotation status, interaction type, and search by video ID
- 🔄 **Flexible Sorting** - Sort by video ID or labeling date (newest first)
- 📄 **Pagination** - Navigate through videos with page controls
- 💾 **Persistent Storage** - PostgreSQL database for reliable persistence
- 🎨 **Dark Mode UI** - Modern dark theme optimized for extended use
- ⚡ **Fast & Local** - Runs entirely on your machine with local Docker database

## Prerequisites

- **Node.js** 18+ ([install](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** package manager: `npm install -g pnpm`
- **PostgreSQL** database:
  - **Recommended:** [Docker](https://www.docker.com/) with provided docker-compose.yml (for development and testing)
  - **Alternative:** Hosted PostgreSQL ([Neon](https://neon.tech), [Supabase](https://supabase.com), etc.) for production
- **Internet connection** (to stream videos from S3)

**Note:** For development and e2e tests, use the local Docker PostgreSQL database. The e2e tests require a clean database state and will fail if pointed to a shared production database.

No Python required. Everything is fetched on-demand from S3.

## Quick Start

### 1. Start PostgreSQL

```bash
# Using Docker (recommended)
docker-compose up -d
```

### 2. Install Dependencies

```bash
cd seamless-interactions-label-studio
pnpm install
```

### 3. Setup Environment

```bash
# Copy environment variables template
cp .env.example .env

# The .env file should point to local PostgreSQL:
# DATABASE_URL="postgresql://seamless:seamless@localhost:5432/seamless_interactions?schema=public"
```

### 4. Setup Database

```bash
# Push schema to database
pnpm db:push

# Import video metadata
pnpm db:import
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**See [SETUP.md](./SETUP.md) for detailed setup instructions, production deployment, and troubleshooting.**

## Usage Guide

### Labeling Workflow

1. **View Dashboard & Videos** - The home page displays:
   - Stats cards at the top (Annotated Videos, Labeled Speakers, Morph Distribution)
   - All filters and search in one horizontal line
   - Scrollable video list below with pagination
2. **Filter & Sort Videos** - Use the filter controls (all on one line) to find specific videos:
   - **Search** - Type to filter by video ID
   - **Annotation Status** - Filter by all/annotated/not annotated
   - **Interaction Type** - Filter by all/improvised/naturalistic
   - **Sort** - Sort by video ID or labeling date (newest first)
3. **Select Video** - Click "Label →" to start annotating or "Edit →" to modify existing annotations
4. **Watch & Analyze** - Both participant videos play in perfect sync with shared playback controls
5. **Label Speakers** - Select Morph A or Morph B for each participant
6. **Set Confidence** - Use individual sliders for each speaker's confidence (1=low, 5=high)
7. **Add Comments** - Include per-speaker observations and notes (optional)
8. **Save** - Click "Save Annotation" to save and return to home page (video stops automatically)
9. **Clear Annotation** - Use "Clear Annotation" button to delete the record (requires confirmation)

### Dashboard Stats

The home page displays at the top:

- **Annotated Videos** - Total number of completed annotations
- **Labeled Speakers** - Total number of speakers annotated (2 per video)
- **Morph Distribution** - Visual breakdown of Morph A vs B proportions across all annotations

### Keyboard Navigation

- Use video player controls for play/pause and seeking
- Both videos stay synchronized automatically
- Timer start/stop is manual (button click)

## Project Structure

```
seamless-interactions-label-studio/
├── .github/workflows/            # GitHub Actions CI/CD
│   └── pr.yml                   # PR checks (lint, tests)
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API routes
│   │   ├── annotations/          # Annotation CRUD operations
│   │   ├── download/             # Video download endpoint
│   │   ├── video/               # Video streaming with range support
│   │   └── videos/              # Video list API with filtering/sorting
│   ├── videos/                  # Video labeling pages
│   │   └── [videoId]/           # Dynamic annotation page per video
│   ├── layout.tsx               # Root layout with fixed header
│   ├── page.tsx                 # Home page with stats and video list
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
│   └── schema.prisma           # Database schema definition
├── downloads/                   # Downloaded videos (gitignored)
├── jest.config.js              # Jest configuration
├── jest.setup.js               # Jest setup with mocks
├── playwright.config.ts        # Playwright configuration
└── package.json                 # Dependencies and scripts
```

## Database Schema

The `Annotation` model stores:

| Field                | Type     | Description                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `id`                 | String   | Unique identifier (CUID)                                          |
| `videoId`            | String   | Video identifier (V{vendor}\_S{session}\_I{interaction}) - unique |
| `vendorId`           | Int      | Vendor ID from dataset                                            |
| `sessionId`          | Int      | Session ID from dataset                                           |
| `interactionId`      | Int      | Interaction ID from dataset                                       |
| `speaker1Id`         | String   | Participant 1 ID (can be alphanumeric, e.g., "0799", "0299A")     |
| `speaker2Id`         | String   | Participant 2 ID                                                  |
| `speaker1Label`      | String   | Morph label for speaker 1                                         |
| `speaker2Label`      | String   | Morph label for speaker 2                                         |
| `speaker1Confidence` | Int      | Confidence score for speaker 1 (1-5)                              |
| `speaker2Confidence` | Int      | Confidence score for speaker 2 (1-5)                              |
| `speaker1Comments`   | String   | Optional comments for speaker 1                                   |
| `speaker2Comments`   | String   | Optional comments for speaker 2                                   |
| `labelingTimeMs`     | Int      | Time spent labeling (milliseconds)                                |
| `createdAt`          | DateTime | Creation timestamp                                                |
| `updatedAt`          | DateTime | Last update timestamp                                             |

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

- Landing on homepage with stats and video list
- Filtering to find a not-annotated video
- Navigating to video labeling page
- Playing video, selecting morphs, setting confidence, adding comments
- Saving annotation and verifying stats update
- Cleanup (deleting the annotation)

### Continuous Integration

The project includes a GitHub Actions workflow (`.github/workflows/pr.yml`) that runs on every PR and push to main. It executes three jobs in parallel:

- **Lint & Format** - Runs ESLint and TypeScript type checking
- **Unit Tests** - Runs Jest tests with coverage report
- **E2E Tests** - Runs Playwright tests against a live dev server

### Database Management

View/edit database directly:

```bash
pnpm db:studio
```

Reset database:

```bash
# Drop all tables and re-create
pnpm db:push --accept-data-loss

# Or using Docker, restart the container
docker-compose down -v
docker-compose up -d
pnpm db:push
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
- **Database**: [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- **Testing**: [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## API Reference

### Annotations API

**GET /api/annotations**

- Returns all annotations ordered by creation date

**POST /api/annotations**

- Creates or updates an annotation (upsert by videoId)
- Body: `{ videoId, vendorId, sessionId, interactionId, speaker1Id, speaker2Id, speaker1Label, speaker2Label, speaker1Confidence, speaker2Confidence, speaker1Comments, speaker2Comments, labelingTimeMs }`

**DELETE /api/annotations?videoId={videoId}**

- Deletes an annotation by videoId

**DELETE /api/annotations?id={id}**

- Deletes an annotation by ID

### Videos API

**GET /api/videos**

- Returns paginated video list with filtering and sorting
- Query params:
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 20)
  - `search` - Filter by video ID
  - `annotatedFilter` - Filter by annotation status (all/annotated/not-annotated)
  - `labelFilter` - Filter by interaction type (all/improvised/naturalistic)
  - `sortBy` - Sort order (videoId/annotatedAt)
- Returns:
  - `interactions` - Array of video metadata
  - `annotatedVideoIds` - Array of annotated video IDs
  - `total` - Total matching videos
  - `page`, `limit`, `totalPages` - Pagination info
  - `filterCounts` - Counts for each filter option
  - `stats` - Morph distribution statistics

### Download API

**POST /api/download**

- Downloads videos from S3
- Body: `{ fileId1, fileId2, label, split, batchIdx }`

**DELETE /api/download?fileId1={id1}&fileId2={id2}**

- Deletes downloaded videos from disk

### Video API

**GET /api/video?fileId={fileId}&label={label}&split={split}**

- Streams video from S3 with range request support
- Automatically downloads and caches videos locally
- Returns 206 Partial Content for seeking
- Validates parameters and handles streaming errors

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
pnpm db:generate

# Reset database (warning: deletes all data)
pnpm db:push --accept-data-loss

# View database
pnpm db:studio

# Check Docker container is running
docker ps | grep postgres
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
- PostgreSQL provides fast queries with proper indexing
- Video metadata cached in database for instant access
- Server components pre-render where possible
- Production build optimizes bundle size
- Filelist cached for 24 hours to reduce GitHub API calls
- 5-minute page revalidation for optimal performance

## License

This tool is created for research purposes. The Seamless Interaction Dataset has its own license terms - please review at [github.com/facebookresearch/seamless_interaction](https://github.com/facebookresearch/seamless_interaction).

## Support

- Review this README for common issues
- See [SETUP.md](./SETUP.md) for detailed setup and troubleshooting
- Check the Seamless Interaction Dataset [documentation](https://github.com/facebookresearch/seamless_interaction)
- Inspect browser console for client-side errors
- Check terminal output for server-side errors
- Use `pnpm db:studio` to inspect database state
