// Detección de pose con MediaPipe, corriendo 100% en el navegador.
import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

export { DrawingUtils, PoseLandmarker };

export async function createPoseLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "VIDEO",
    numPoses: 1,
  });
  // GPU es más rápido; si el celular no lo permite, el procesador (CPU) funciona igual, solo más lento.
  try {
    return await PoseLandmarker.createFromOptions(vision, options("GPU"));
  } catch {
    return PoseLandmarker.createFromOptions(vision, options("CPU"));
  }
}

// MediaPipe exige timestamps siempre crecientes, incluso entre videos distintos.
let timestampBase = 0;

// Recorre el video cuadro por cuadro (a sampleFps) y guarda la pose de cada uno.
export async function analyzeVideo(video, landmarker, { sampleFps = 60, onProgress } = {}) {
  const duration = video.duration;
  const step = 1 / sampleFps;
  const frames = [];

  for (let t = 0; t < duration; t += step) {
    await seekTo(video, t);
    const result = landmarker.detectForVideo(video, timestampBase + Math.round(t * 1000));
    frames.push({
      t,
      landmarks: result.landmarks[0] ?? null,
      world: result.worldLandmarks[0] ?? null,
    });
    onProgress?.(t / duration);
  }

  timestampBase += Math.ceil(duration * 1000) + 1000;
  await seekTo(video, 0);
  return frames;
}

function seekTo(video, t) {
  if (Math.abs(video.currentTime - t) < 1e-6) return Promise.resolve();
  return new Promise((resolve) => {
    video.addEventListener("seeked", resolve, { once: true });
    video.currentTime = t;
  });
}
