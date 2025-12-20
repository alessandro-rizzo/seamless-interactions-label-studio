# Seamless Interactions Label Studio

A professional web-based annotation tool for labeling speaker morphs in the [Seamless Interaction Dataset](https://github.com/facebookresearch/seamless_interaction). Built for observational coding exercises with synchronized video playback, timing tracking, and comprehensive statistics.

## Features

- 📋 **Browse All Videos** - See all 4000+ hours available in the dataset (fetched from GitHub)
- 📥 **On-Demand Downloads** - Download specific videos directly from S3 (no Python required!)
- 🗑️ **Disk Management** - Delete videos from disk after annotation to save space
- 📹 **Synchronized Dual Video Player** - Watch both participants side-by-side with frame-perfect synchronization
- ⏱️ **Built-in Timer** - Track annotation time with start/stop controls
- ✅ **Progress Tracking** - Visual indicators showing completed vs. pending annotations
- 🏷️ **Binary Labeling** - Label each speaker as Morph A or Morph B with confidence scoring (1-5 scale)
- 💬 **Comments** - Add observations and notes to each annotation
- 📊 **Statistics Dashboard** - View morph distribution, completion rates, and time metrics
- 💾 **Persistent Storage** - SQLite database that survives app restarts
- 📤 **Export Options** - Download annotations as CSV or JSON
- 🎨 **Dark Mode UI** - Modern dark theme optimized for extended use
- ⚡ **Fast & Local** - Runs entirely on your machine with Python toolkit integration

## Prerequisites

- **Node.js** 18+ ([install](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** package manager: `npm install -g pnpm`
- **Internet connection** (to fetch video list and download videos)

That's it! No Python, no local dataset required. Everything is fetched on-demand.

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

1. **Browse Videos** - Click "Label Videos" from the home page to see all available interactions (from the full dataset)
2. **Download Video** - Click "Download" to fetch the video on-demand from S3 (typically 30-50 MB, takes a few seconds)
3. **Watch & Analyze** - Both participant videos play in perfect sync with shared playback controls
4. **Start Timer** - Begin timing when you start analyzing the interaction
5. **Label Speakers** - Select Morph A or Morph B for each participant from the dropdown menus
6. **Set Confidence** - Use the slider to indicate your confidence level (1=low, 5=high)
7. **Add Comments** - Include any observations or notes
8. **Save** - Stop timer and save your annotation
9. **Clean Up** - Delete the video from disk using the trash icon to save space

### Statistics & Export

Navigate to the **Statistics** page to:

- View completion progress and totals
- See morph distribution across all annotations
- Review average confidence scores
- Check total and average labeling time
- Browse recent annotations
- **Export data** - Click "Export CSV" or "Export JSON" to download all annotations

### Customizing Labels

Edit `components/labeling-form.tsx` line 11 to customize morph options:

```typescript
const MORPH_OPTIONS = ["Morph A", "Morph B"];
```

Current options are **Morph A** and **Morph B** only.

### Using Different Dataset Location

If your dataset is not at `~/personal/seamless_interaction`, update the path in `lib/dataset.ts`:

```typescript
const DATASET_PATH = path.join(process.env.HOME || '', 'your', 'path', 'here');
```

## Project Structure

```
seamless-interactions-label-studio/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API routes
│   │   ├── annotations/          # Annotation CRUD operations
│   │   ├── export/              # CSV/JSON export endpoint
│   │   └── video/               # Video streaming with range support
│   ├── statistics/              # Statistics dashboard page
│   ├── videos/                  # Video list and labeling pages
│   │   └── [videoId]/           # Dynamic annotation page per video
│   ├── layout.tsx               # Root layout with header
│   ├── page.tsx                 # Home page with overview
│   └── globals.css              # Tailwind styles
├── components/                   # React components
│   ├── labeling-form.tsx        # Annotation form with timer
│   ├── synchronized-video-player.tsx  # Dual video player
│   └── video-player.tsx         # Single video player
├── lib/                         # Core utilities
│   ├── db.ts                   # Prisma client singleton
│   ├── dataset.ts              # Dataset scanning and parsing
│   └── utils.ts                # Helper functions
├── prisma/                      # Database
│   ├── schema.prisma           # Database schema definition
│   └── dev.db                  # SQLite database (gitignored)
├── __tests__/                   # Test suite
│   └── lib/                    # Unit tests
└── package.json                 # Dependencies and scripts
```

## Database Schema

The `Annotation` model stores:

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier (CUID) |
| `videoId` | String | Video identifier (V{vendor}_S{session}_I{interaction}) |
| `vendorId` | Int | Vendor ID from dataset |
| `sessionId` | Int | Session ID from dataset |
| `interactionId` | Int | Interaction ID from dataset |
| `speaker1Id` | Int | Participant 1 ID |
| `speaker2Id` | Int | Participant 2 ID |
| `speaker1Label` | String | Morph label for speaker 1 |
| `speaker2Label` | String | Morph label for speaker 2 |
| `comments` | String | Optional comments |
| `confidence` | Int | Confidence score (1-5) |
| `labelingTimeMs` | Int | Time spent labeling (milliseconds) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

## Development

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

### Database Management

View/edit database directly:
```bash
pnpm prisma studio
```

Reset database:
```bash
pnpm prisma migrate reset
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
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Database**: [SQLite](https://www.sqlite.org/) + [Prisma ORM](https://www.prisma.io/)
- **Testing**: [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/react)
- **Package Manager**: [pnpm](https://pnpm.io/)

## API Reference

### Annotations API

**GET /api/annotations**
- Returns all annotations ordered by creation date

**POST /api/annotations**
- Creates or updates an annotation
- Body: `{ videoId, vendorId, sessionId, interactionId, speaker1Id, speaker2Id, speaker1Label, speaker2Label, comments, confidence, labelingTimeMs }`

**DELETE /api/annotations?id={id}**
- Deletes an annotation by ID

### Export API

**GET /api/export?format={csv|json}**
- Downloads all annotations in specified format
- Returns file with download headers

### Video API

**GET /api/video?path={absolutePath}**
- Streams video file with range request support
- Validates path is within dataset directory
- Returns 206 Partial Content for seeking

## Troubleshooting

### Downloads are slow

Videos are typically 30-50 MB each and download directly from S3. Download speed depends on your internet connection. The app uses streaming downloads with progress indicators.

### Videos won't play

- Open browser console to check for errors
- Verify video paths are correct
- Ensure videos are valid MP4 format
- Check that video API endpoint is accessible

### Database errors

```bash
# Regenerate Prisma client
pnpm prisma generate

# Reset database (warning: deletes all data)
pnpm prisma migrate reset

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

## Dataset Requirements

The app expects videos following this naming pattern:
```
V{vendor}_S{session}_I{interaction}_P{participant}.mp4
```

Example: `V1_S2_I3_P4.mp4`
- Vendor: 1
- Session: 2
- Interaction: 3
- Participant: 4

Videos are automatically grouped by interaction ID. Each interaction must have at least 2 participant videos to appear in the list.

## Performance Notes

- Videos are streamed directly from disk (not loaded into memory)
- Range requests enable seeking without full download
- SQLite provides fast local queries
- Static pages pre-rendered where possible
- Production build optimizes bundle size

## License

This tool is created for research purposes. The Seamless Interaction Dataset has its own license terms - please review at [github.com/facebookresearch/seamless_interaction](https://github.com/facebookresearch/seamless_interaction).

## Contributing

This is a research tool. To suggest improvements:

1. Test your changes locally
2. Run the test suite: `pnpm test`
3. Ensure build succeeds: `pnpm build`
4. Document any new features

## Support

- Review this README and the [original requirements](CLAUDE.md)
- Check the Seamless Interaction Dataset [documentation](https://github.com/facebookresearch/seamless_interaction)
- Inspect browser console for client-side errors
- Check terminal output for server-side errors
- Use `pnpm prisma studio` to inspect database state
