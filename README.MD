![Project Screenshot](./ss-stridash.png)

## **Stridash**

**Stridash** is a synchronization tool designed to overlay real-time athletic performance data onto video footage. By matching the timestamps of a video file with the telemetry from a `.fit` file, Stridash creates a data-rich visual representation of your activity.

---

### **Core Functionality**

The app resolves the challenge of manually aligning video clips with sports watch data:

- **Simultaneous Recording:** Record video while your sports watch tracks your activity (e.g., running, cycling).

- **Data Integration:** Import your video file and the corresponding `.fit` file exported from your wearable device.

- **Temporal Sync:** The app automatically aligns the video’s specific timeframe (e.g., a 15-second clip at 6:00:15 AM) with the exact data points from your total activity duration.

- **Dynamic Overlay:** Generates a result showing your activity metrics (speed, heart rate, elevation) as a synchronized overlay on your video.

### **How it Works**

1. **Record:** Start your activity tracking on your watch and capture video at any point during that session.

2. **Download:** Export the `.fit` file from your activity provider (Garmin, Strava, etc.).

3. **Sync:** Upload both files to Stridash. The app parses the timestamps to find the precise match.

4. **Result:** View or export your video with a professional data overlay that mirrors your condition at the exact moment the footage was taken.

### **Notable Work: Agentic AI-Assisted Development**

The development of Stridash utilized advanced **Agentic AI** workflows to solve complex engineering challenges:

- **Compound Method:** Built using a "Plan → Work → Review → Compound" cycle, ensuring architectural integrity through iterative AI-driven refinement.

- **Intelligent Integration:** Leveraged AI agents to ingest external repositories as submodules, allowing the system to learn and implement only the essential logic for file parsing and data synchronization.

### **Technical Implementation**

- **Video Processing Architecture:** Implemented a hybrid approach that respects web limitations by offloading intensive video processing to the server.

- **Dynamic Rendering:** Utilized **Canvas API** to draw high-performance data overlays and integrated **Remotion** for programmatic video frame generation.

- **Timeline Editing:** Integrated a custom video timeline editor to allow for fine-tuned manual adjustments of activity sync points.

- **Logic:** Precise temporal data matching and specialized `.fit` file parsing for telemetry extraction.

### **Tech Stack**

- **Frontend:** React, TypeScript.
- **Video/Graphics:** Remotion, Canvas API.
- **Infrastructure:** Server-side video processing engines.
