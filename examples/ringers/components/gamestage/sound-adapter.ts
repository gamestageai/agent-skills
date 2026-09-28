/**
 * How an allowed cue is actually made audible. Behind an interface because no
 * asset exists yet (GSUI-38 attaches a real file to each name): today
 * "playing" a cue never touches the network or the disk, which is what keeps
 * REQ-001 true once this stops being a stub.
 *
 * HTMLAudioElement is the default because it is the element whose playback
 * iOS Safari's hardware silent switch actually silences; a raw WebAudio graph
 * bypasses that switch entirely, which is why os-mute.ts exists as a
 * best-effort backstop rather than the only mechanism.
 */
export interface SoundAdapter {
  /**
   * `magnitude` is how much of the thing happened, where the design pitches a
   * cue by a number: `sfx.streak` by the run's length, `sfx.xp` by the amount
   * awarded. Undefined for every cue that is not pitched, and an adapter that
   * ignores it is correct rather than incomplete.
   */
  play(name: string, magnitude?: number): void
}

export function createHtmlAudioAdapter(): SoundAdapter {
  return {
    play() {
      // No asset files yet. The caller has already recorded the intent
      // before reaching here; there is nothing to play.
    },
  }
}

export function createWebAudioAdapter(): SoundAdapter {
  return {
    play() {
      // Same stub, kept as a distinct adapter so GSUI-38 can wire a real
      // AudioBufferSourceNode here without re-deciding which of the two
      // honours the silent switch.
    },
  }
}
