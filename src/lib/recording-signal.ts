/** Reject silence before uploading; encoded file size is not evidence of speech. */
export function hasAudibleSignal(channels: readonly Float32Array[], sampleRate: number): boolean {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) return false;
  const frame = Math.max(1, Math.round(sampleRate * 0.02));
  let activeMs = 0;
  const length = Math.max(0, ...channels.map((c) => c.length));
  for (let offset = 0; offset < length; offset += frame) {
    let active = false;
    for (const channel of channels) {
      const end = Math.min(offset + frame, channel.length);
      const count = end - offset;
      if (count <= 0) continue;
      let mean = 0;
      for (let i = offset; i < end; i++) mean += channel[i] ?? 0;
      mean /= count;
      let energy = 0;
      for (let i = offset; i < end; i++) energy += ((channel[i] ?? 0) - mean) ** 2;
      if (Math.sqrt(energy / count) >= 0.008) active = true;
    }
    if (active) activeMs += Math.min(frame, length - offset) / sampleRate * 1000;
  }
  return activeMs >= 120;
}

/** Decode the complete recording, including Safari's M4A, without playing it. */
export async function recordingHasSignal(blob: Blob): Promise<boolean> {
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    return hasAudibleSignal(Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i)), audio.sampleRate);
  } finally {
    await context.close();
  }
}