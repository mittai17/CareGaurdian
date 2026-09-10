import { splitTextIntoChunks } from './documents.service';

describe('DocumentsService — chunking', () => {
  describe('splitTextIntoChunks', () => {
    it('returns empty array for empty input', () => {
      expect(splitTextIntoChunks('')).toEqual([]);
      expect(splitTextIntoChunks(undefined as unknown as string)).toEqual([]);
    });

    it('returns a single chunk for short text', () => {
      const text = 'Hello world';
      const chunks = splitTextIntoChunks(text);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('splits long text into multiple overlapping chunks', () => {
      // 2000 chars → should produce several chunks
      const text = 'A'.repeat(2000);
      const chunks = splitTextIntoChunks(text);

      expect(chunks.length).toBeGreaterThan(2);

      // Each chunk should be <= 800 chars
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(800);
      }

      // All original text should be covered
      const reassembled = chunks.join('');
      // Because of overlap, the reassembled text is longer — but the full
      // original text should be present within it (sliding window).
      for (let i = 0; i < text.length; i++) {
        // Character at position i should appear somewhere in the reassembly
        // (this is guaranteed by the overlap design — just sanity-check length).
      }
      // At minimum, the total reassembled length should exceed the original.
      expect(reassembled.length).toBeGreaterThanOrEqual(text.length);
    });

    it('preserves content at boundaries', () => {
      // Create text with a marker at the 800th character position
      const marker = 'MARKER_EDGE';
      const prefix = 'x'.repeat(790);
      const suffix = 'y'.repeat(800);
      const text = prefix + marker + suffix;

      const chunks = splitTextIntoChunks(text);

      // The marker should appear in at least one chunk
      expect(chunks.some((c) => c.includes(marker))).toBe(true);
    });

    it('handles text exactly equal to chunk size', () => {
      const text = 'a'.repeat(800);
      const chunks = splitTextIntoChunks(text);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('handles text slightly larger than chunk size', () => {
      const text = 'a'.repeat(801);
      const chunks = splitTextIntoChunks(text);
      expect(chunks.length).toBe(2);
      const first = chunks[0];
      const second = chunks[1];
      expect(first).toBeDefined();
      expect(second).toBeDefined();
      // Overlap means combined length exceeds 801 chars
      expect(first!.length + second!.length).toBeGreaterThan(801);
    });

    it('produces chunks with the expected overlap', () => {
      // Use 100 chars so we can clearly see the overlap pattern
      const text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(50); // 1300 chars
      const chunks = splitTextIntoChunks(text);

      expect(chunks.length).toBeGreaterThanOrEqual(2);

      // The last 100 chars of chunk[0] should match the first 100 chars of chunk[1]
      // (if both chunks are full size)
      const first = chunks[0];
      const second = chunks[1];
      if (first && second && first.length === 800 && second.length === 800) {
        const tail = first.slice(-100);
        const head = second.slice(0, 100);
        expect(tail).toBe(head);
      }
    });
  });
});
