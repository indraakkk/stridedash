#!/usr/bin/env bun
/**
 * Generate a test MP4 with creation_time metadata for FIT sync testing.
 * The creation_time is read by parseMp4CreationTime in production to auto-sync with FIT data.
 *
 * Usage: bun run scripts/gen-test-video.ts "2026-02-12T06:00:00+07:00" 15 test-video.mp4
 */

const [creationTime, duration = "15", output = "test-video.mp4"] = Bun.argv.slice(2);

if (!creationTime) {
  console.log("Usage: bun run scripts/gen-test-video.ts <creation_time_iso8601> [duration_secs] [output]");
  console.log('Example: bun run scripts/gen-test-video.ts "2026-02-12T06:00:00+07:00" 15 test-video.mp4');
  process.exit(1);
}

console.log(`Generating ${duration}s test video (1080x1920, H.264, 30fps)...`);
console.log(`Creation time: ${creationTime}`);

const proc = Bun.spawn([
  "ffmpeg", "-y",
  "-f", "lavfi", "-i", `testsrc2=duration=${duration}:size=1080x1920:rate=30`,
  "-f", "lavfi", "-i", `sine=frequency=0:sample_rate=48000:duration=${duration}`,
  "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "128k",
  "-metadata", `creation_time=${creationTime}`,
  "-movflags", "+faststart",
  output,
], { stdout: "inherit", stderr: "inherit" });

const exitCode = await proc.exited;
if (exitCode !== 0) process.exit(exitCode);

const sizeMB = (Bun.file(output).size / 1024 / 1024).toFixed(1);
console.log(`\nDone: ${output} (${sizeMB} MB)`);
console.log(`Verify: ffprobe -v quiet -show_entries format_tags=creation_time "${output}"`);
