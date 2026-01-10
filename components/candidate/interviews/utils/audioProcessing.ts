/**
 * Audio processing utilities for Live Interview
 * Handles audio format conversion, downsampling, and encoding
 */

export const TARGET_SAMPLE_RATE = 16000;
export const PLAYBACK_SAMPLE_RATE = 24000;

/**
 * Convert Uint8Array to base64 string
 */
export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string or array to ArrayBuffer
 */
export function base64ToArrayBuffer(
  data: string | Uint8Array | number[],
): ArrayBuffer {
  if (typeof data === "string") {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  if (data instanceof Uint8Array) {
    const sliced = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    );
    // Ensure we return ArrayBuffer (not SharedArrayBuffer)
    return sliced instanceof ArrayBuffer ? sliced : new ArrayBuffer(0);
  }
  if (Array.isArray(data)) {
    const bytes = Uint8Array.from(data);
    return bytes.buffer;
  }
  return new ArrayBuffer(0);
}

/**
 * Downsample audio to 16kHz using linear interpolation
 * Converts Float32Array to Int16Array (16-bit PCM)
 */
export function downsampleTo16k(
  input: Float32Array,
  inputSampleRate: number,
): Int16Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    const buffer = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      buffer[i] = s * 0x7fff;
    }
    return buffer;
  }

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const newLength = Math.round(input.length / ratio);
  const result = new Int16Array(newLength);

  // Use linear interpolation for better quality (reduces aliasing)
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
    const t = srcIndex - srcIndexFloor;

    // Linear interpolation
    const sample = input[srcIndexFloor] * (1 - t) + input[srcIndexCeil] * t;
    const clamped = Math.max(-1, Math.min(1, sample));
    result[i] = clamped * 0x7fff;
  }

  return result;
}

/**
 * Check if audio frame has any signal (not completely silent)
 */
export function isFrameAudible(frame: Float32Array): boolean {
  if (!frame || frame.length === 0) return false;

  // Only filter out frames that are completely silent (all zeros)
  for (let i = 0; i < frame.length; i++) {
    if (Math.abs(frame[i]) > 0.000001) {
      return true;
    }
  }

  return false;
}

