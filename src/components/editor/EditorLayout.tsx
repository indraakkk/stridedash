import { useCallback, useEffect, useRef, useState } from "react";
import { useProjectStore } from "~/stores/project-store";
import { PreviewPlayer } from "~/components/preview/PreviewPlayer";
import { GaugeDragLayer } from "~/components/gauges/GaugeDragLayer";
import { SafeZoneOverlay } from "~/components/gauges/SafeZoneOverlay";
import { SnapGuideLines } from "~/components/gauges/SnapGuideLines";
import { GaugePanel } from "~/components/panels/GaugePanel";
import { GaugeConfigPanel } from "~/components/panels/GaugeConfigPanel";
import { SyncPanel } from "~/components/panels/SyncPanel";
import { ExportPanel } from "~/components/panels/ExportPanel";
import { Timeline } from "~/components/timeline/Timeline";
import { DropZone } from "~/components/upload/DropZone";
import { ScrollShadow } from "~/components/ui/scroll-shadow";
import { parseFitFileClient } from "~/lib/parse-fit-client";
import { probeVideoClient } from "~/lib/probe-video-client";

// Composition aspect ratio (9:16 portrait)
const ASPECT_W = 9;
const ASPECT_H = 16;

export function EditorLayout() {
  const setVideoMeta = useProjectStore((s) => s.setVideoMeta);
  const setVideoFile = useProjectStore((s) => s.setVideoFile);
  const setFitTimeline = useProjectStore((s) => s.setFitTimeline);
  const setFitFile = useProjectStore((s) => s.setFitFile);
  const videoFile = useProjectStore((s) => s.videoFile);
  const fitFile = useProjectStore((s) => s.fitFile);
  const videoMeta = useProjectStore((s) => s.videoMeta);
  const fitTimeline = useProjectStore((s) => s.fitTimeline);

  const [videoLoading, setVideoLoading] = useState(false);
  const [fitLoading, setFitLoading] = useState(false);

  // Measure available space and compute preview dimensions
  const mainRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState({ w: 540, h: 960 });

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const availW = el.clientWidth - 32;
      const availH = el.clientHeight - 64; // room for frame counter
      const scaleW = availW / ASPECT_W;
      const scaleH = availH / ASPECT_H;
      const scale = Math.min(scaleW, scaleH);
      setPreviewSize({
        w: Math.round(ASPECT_W * scale),
        h: Math.round(ASPECT_H * scale),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleVideoFile = useCallback(
    async (file: File) => {
      setVideoFile(file);
      setVideoLoading(true);
      try {
        const meta = await probeVideoClient(file);
        setVideoMeta(meta);
      } catch (err) {
        console.error("Video probe error:", err);
      } finally {
        setVideoLoading(false);
      }
    },
    [setVideoFile, setVideoMeta],
  );

  const handleFitFile = useCallback(
    async (file: File) => {
      setFitFile(file);
      setFitLoading(true);
      try {
        const timeline = await parseFitFileClient(file);
        setFitTimeline(timeline);
      } catch (err) {
        console.error("FIT parse error:", err);
      } finally {
        setFitLoading(false);
      }
    },
    [setFitFile, setFitTimeline],
  );

  const hasVideo = videoMeta != null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card/80 backdrop-blur-sm">
          <ScrollShadow>
            {/* Upload section */}
            <div className="flex flex-col gap-3 border-b border-border p-4">
              <DropZone
                accept="video/*,.mp4,.mov,.webm"
                label="Drop video file"
                description=".mp4, .mov, .webm"
                onFile={handleVideoFile}
                file={videoFile}
                isLoading={videoLoading}
              />
              <DropZone
                accept=".fit"
                label="Drop .fit file"
                description="Garmin .fit activity"
                onFile={handleFitFile}
                file={fitFile}
                isLoading={fitLoading}
              />

              {/* File summaries */}
              {videoMeta && (
                <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                  <p>
                    {videoMeta.width}x{videoMeta.height} · {videoMeta.fps}fps ·{" "}
                    {videoMeta.codec}
                  </p>
                  <p>Duration: {videoMeta.duration.toFixed(1)}s</p>
                </div>
              )}
              {fitTimeline && (
                <div className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                  <p>{fitTimeline.records.length} data points</p>
                  <p>
                    Duration:{" "}
                    {(fitTimeline.endTime - fitTimeline.startTime).toFixed(0)}s
                  </p>
                  {fitTimeline.avgHeartRate && (
                    <p>Avg HR: {Math.round(fitTimeline.avgHeartRate)} bpm</p>
                  )}
                </div>
              )}
            </div>

            {/* Gauge panel */}
            <GaugePanel />

            {/* Gauge config (when selected) */}
            <GaugeConfigPanel />

            {/* Sync panel */}
            <SyncPanel />

            {/* Export panel */}
            <ExportPanel />
          </ScrollShadow>
        </aside>

        {/* Main preview area */}
        <main
          ref={mainRef}
          className="flex flex-1 items-center justify-center bg-background p-4"
        >
          {hasVideo ? (
            <div
              className="relative"
              style={{ width: previewSize.w, height: previewSize.h }}
            >
              <PreviewPlayer width={previewSize.w} height={previewSize.h} />
              <GaugeDragLayer
                containerWidth={previewSize.w}
                containerHeight={previewSize.h}
              />
              <SafeZoneOverlay
                containerWidth={previewSize.w}
                containerHeight={previewSize.h}
              />
              <SnapGuideLines
                containerWidth={previewSize.w}
                containerHeight={previewSize.h}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Upload a video to start</p>
              <p className="mt-1 text-sm">
                Drag files to the sidebar or click to browse
              </p>
              <p className="mt-1 text-xs">
                Add a .fit file for real activity data, or use demo mode
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Timeline (bottom) */}
      <Timeline />
    </div>
  );
}
