// Web Audio phase-change cue (FEATURE_SPECS.md § Widgets / Pomodoro —
// "Audio cues on phase start/end"). No bundled sound asset needed: a short
// sine-wave tone is synthesized on the fly. Browser-only (AudioContext), so
// like browserFetchAndEncode this is exercised via manual smoke testing
// rather than a unit test.
export function playBeep(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => void ctx.close();
  } catch {
    // Web Audio unavailable or blocked by autoplay policy — skip the cue
    // rather than throwing.
  }
}
