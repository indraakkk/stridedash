# Test Video Generator

Generate MP4 test videos with specific creation timestamps for testing FIT file sync.

## Prerequisites

- ffmpeg (included in devenv.nix)
- Bun runtime

## Usage

```
bun run scripts/gen-test-video.ts <creation_time> [duration_secs] [output_file]
```

### Parameters

| Parameter       | Required | Default          | Description                              |
|----------------|----------|------------------|------------------------------------------|
| creation_time  | Yes      | —                | ISO 8601 datetime with timezone offset   |
| duration_secs  | No       | 15               | Video duration in seconds                |
| output_file    | No       | test-video.mp4   | Output file path                         |

### Examples

```bash
# 15-second video at 06:00 AM UTC+7, 12 Feb 2026
bun run scripts/gen-test-video.ts "2026-02-12T06:00:00+07:00"

# 30-second video with custom output name
bun run scripts/gen-test-video.ts "2026-02-12T06:00:00+07:00" 30 my-test.mp4

# Video at activity start (05:05 AM)
bun run scripts/gen-test-video.ts "2026-02-12T05:05:00+07:00" 15 start-of-run.mp4
```

## How It Works

- Uses ffmpeg `testsrc2` to generate a colorful animated pattern (not black)
- Sets `creation_time` in MP4 container metadata
- Output: H.264 + AAC, 1080x1920 portrait (Instagram Reels), 30fps
- The creation_time is used by the app's sync engine (via `parseMp4CreationTime`) to auto-align video with FIT activity data

## Verifying Metadata

```bash
ffprobe -v quiet -show_entries format_tags=creation_time test-video.mp4
```

## Testing Sync with FIT File

1. Generate a video with creation_time inside your FIT activity window
2. Load both the video and .fit file in the app
3. The sync engine reads creation_time and auto-calculates the offset
4. Verify gauges display correct FIT data for that time window

## Example: today15k.fit

Activity window: 05:05 AM – 07:10 AM UTC+7, 12 Feb 2026

```bash
# At 06:00 — 55 min into activity
bun run scripts/gen-test-video.ts "2026-02-12T06:00:00+07:00" 15 test-video.mp4

# At start of activity
bun run scripts/gen-test-video.ts "2026-02-12T05:05:00+07:00" 15 test-start.mp4

# Near end of activity
bun run scripts/gen-test-video.ts "2026-02-12T07:00:00+07:00" 15 test-end.mp4
```
