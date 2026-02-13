# Stridash — Project Summary

## Current Status: Not Production-Ready

### What Works
1. **Video export is functional** — Can export video with gauge overlays using client-side canvas capture and MediaRecorder (WebM output).

### Known Issues
2. **Export video blinking** — The exported video exhibits blinking/flickering artifacts during playback, likely caused by frame timing issues in the canvas capture pipeline.

### Open Research Areas
3. **Export without crushing original video quality** — Need to find an approach for compositing the overlay canvas gauges onto the original video without re-encoding or degrading the source video data. Current method (MediaRecorder from canvas) re-encodes everything, which loses quality.

4. **File processing pipeline (MinIO)** — Need to design the flow for uploading and storing user files (FIT data files and video files) to MinIO object storage. Currently everything is client-side only.

5. **Instagram-compatible export** — Exported video must be smooth and meet Instagram's media requirements:
   - H.264 codec (MP4 container, not WebM)
   - Consistent frame rate (30fps)
   - Proper resolution (1080x1920 for stories/reels, 1080x1080 for feed)
   - No frame drops or blinking artifacts

### Root Cause: Export Blinking
- `captureStream(fps)` + `MediaRecorder` captures on its own real-time timer, not synced to the render loop
- Between `clearRect()` and the async `seekVideo()` completing, the stream grabs blank/half-drawn frames
- `MediaRecorder` is fundamentally wrong for frame-by-frame offline rendering with async work

### Next Step: Server-Side FFmpeg via MinIO
- Upload original video + FIT file to MinIO
- Server-side FFmpeg composites gauge overlay onto original video using `overlay` filter
- Solves blinking (no real-time capture), preserves original video quality (no re-encoding source), and outputs H.264/MP4 (Instagram-compatible)
- This approach consolidates items 2, 3, 4, and 5 into one pipeline
