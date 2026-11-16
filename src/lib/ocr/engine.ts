export type OcrProgress = (percent: number, status: string) => void;
export async function readKtpImage(image: string, onProgress: OcrProgress): Promise<string> {
  const { createWorker, PSM } = await import("tesseract.js");
  onProgress(3, "Menyiapkan OCR");
  const worker = await createWorker("ind", 1, { logger: item => { if (item.status === "recognizing text") onProgress(Math.max(5, Math.round(item.progress * 92)), "Membaca KTP"); } });
  try {
    // KTP is a dense single block, but a sparse pass recovers labels near the edges.
    const modes = [PSM.SINGLE_BLOCK, PSM.SPARSE_TEXT, PSM.SINGLE_COLUMN] as const;
    const results: string[] = [];
    for (let i = 0; i < modes.length; i++) {
      await worker.setParameters({ tessedit_pageseg_mode: modes[i] });
      const { data } = await worker.recognize(image);
      results.push(data.text);
      onProgress(15 + Math.round(((i + 1) / modes.length) * 78), i === modes.length - 1 ? "Memproses hasil" : "Membaca KTP");
    }
    // Prefer the pass that found the most KTP labels; do not merge raw OCR text
    // because merging can duplicate values and confuse the field parser.
    const labels = /(NIK|NAMA|LAHIR|JENIS|ALAMAT|RT|RW|KEL|KECAMATAN|AGAMA|PEKERJAAN|KEWARGA)/gi;
    const best = results.sort((a, b) => (b.match(labels)?.length ?? 0) - (a.match(labels)?.length ?? 0))[0] || "";
    onProgress(96, "Memproses hasil"); return best;
  } finally { await worker.terminate(); }
}
