/**
 * Generates a small choir-like sample WAV (a four-part chord progression with
 * a melody on top) so users can try the player without uploading a file.
 */
export function generateSampleWav(): { buffer: Buffer; duration: number } {
  const sampleRate = 22050;
  const bpm = 80;
  const beat = 60 / bpm;
  // chord progression (MIDI notes) — S A T B, 4 beats each
  const chords = [
    [72, 67, 64, 48], // C
    [69, 65, 60, 41], // F
    [71, 67, 62, 43], // G
    [72, 67, 64, 48], // C
    [69, 64, 60, 45], // Am
    [69, 65, 62, 50], // Dm
    [67, 62, 59, 43], // G
    [72, 67, 64, 48], // C
  ];
  const melody = [
    72, 74, 76, 77, 76, 74, 72, 71, 69, 71, 72, 74, 72, 71, 69, 67, 65, 67, 69, 71, 69, 67, 65, 62, 67, 71, 74, 71, 72,
    76, 79, 84,
  ];
  const totalBeats = chords.length * 4;
  const duration = totalBeats * beat;
  const n = Math.floor(duration * sampleRate);
  const data = new Float32Array(n);
  const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

  const addNote = (midi: number, startSec: number, lenSec: number, amp: number) => {
    const f = freq(midi);
    const s = Math.floor(startSec * sampleRate);
    const l = Math.floor(lenSec * sampleRate);
    for (let i = 0; i < l && s + i < n; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1, t / 0.06);
      const release = Math.min(1, (l - i) / (0.12 * sampleRate));
      const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.2 * t);
      const ph = 2 * Math.PI * f * vib * t;
      const v = Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.15 * Math.sin(3 * ph);
      data[s + i] += v * amp * attack * release;
    }
  };

  chords.forEach((chord, ci) => {
    chord.forEach((m, vi) => addNote(m, ci * 4 * beat, 4 * beat - 0.02, vi === 3 ? 0.16 : 0.1));
  });
  melody.forEach((m, i) => addNote(m + 0, i * 1 * beat, beat * 0.95, 0.12));

  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]));
  const gain = peak > 0 ? 0.85 / peak : 1;

  const buffer = Buffer.alloc(44 + n * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + n * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(data[i] * gain * 32767))), 44 + i * 2);
  }
  return { buffer, duration };
}
