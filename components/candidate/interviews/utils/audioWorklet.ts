/**
 * Audio Worklet utilities for Live Interview
 * Handles AudioWorklet setup and processing
 * 
 * Why PCMWorkletProcessor?
 * - AudioWorklet processes audio in a separate thread (better performance than deprecated ScriptProcessorNode)
 * - Provides low-latency, real-time audio processing needed for live interviews
 * - Allows continuous audio streaming without blocking the main thread
 * - More efficient than ScriptProcessorNode which runs on the main thread
 */

let workletLoaded = false;

/**
 * Ensure AudioWorklet is loaded and ready
 */
export async function ensureAudioWorklet(
  context: AudioContext,
): Promise<boolean> {
  if (!context.audioWorklet || typeof AudioWorkletNode === "undefined") {
    return false;
  }

  if (workletLoaded) return true;

  const processorCode = `
    class PCMWorkletProcessor extends AudioWorkletProcessor {
      process(inputs) {
        const input = inputs[0];
        if (!input || input.length === 0) return true;
        const channelData = input[0];
        // Copy the frame to transfer back to main thread
        this.port.postMessage(channelData.slice());
        return true;
      }
    }
    registerProcessor('pcm-worklet', PCMWorkletProcessor);
  `;

  const blob = new Blob([processorCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  try {
    await context.audioWorklet.addModule(url);
    workletLoaded = true;
    return true;
  } catch (error) {
    console.error("Failed to load audio worklet:", error);
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Reset worklet loaded state (useful for testing or reconnection)
 */
export function resetWorkletState(): void {
  workletLoaded = false;
}

