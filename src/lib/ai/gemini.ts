import { z } from "zod";
import type { KtpData } from "@/types/ktp";
type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

const resultSchema = z.object({
  nik: z.string().catch(""), nama: z.string().catch(""), tempatLahir: z.string().catch(""), tanggalLahir: z.string().catch(""),
  jenisKelamin: z.string().catch(""), golonganDarah: z.string().catch(""), alamat: z.string().catch(""), rt: z.string().catch(""), rw: z.string().catch(""),
  kelurahanDesa: z.string().catch(""), kecamatan: z.string().catch(""), agama: z.string().catch(""), statusPerkawinan: z.string().catch(""), pekerjaan: z.string().catch(""), kewarganegaraan: z.string().catch(""), berlakuHingga: z.string().catch("")
});

const prompt = `Anda adalah mesin ekstraksi data KTP Indonesia. Baca hanya teks yang benar-benar terlihat pada gambar. Jangan menebak atau mengarang nilai. Kembalikan JSON object saja dengan keys persis: nik, nama, tempatLahir, tanggalLahir, jenisKelamin, golonganDarah, alamat, rt, rw, kelurahanDesa, kecamatan, agama, statusPerkawinan, pekerjaan, kewarganegaraan, berlakuHingga. Gunakan string kosong jika tidak terbaca. Pertahankan NIK sebagai 16 digit string; koreksi O→0, I/l→1 hanya bila konteksnya jelas sebagai angka. Format tanggal DD-MM-YYYY jika tanggal terlihat. Untuk RT dan RW, keluarkan angka saja tanpa label. Jangan mengisi berdasarkan asumsi umum.`;

function config() { const key = process.env.GEMINI_API_KEY; if (!key) throw new Error("GEMINI_API_KEY belum dikonfigurasi."); const configuredTimeout = Number(process.env.OCR_TIMEOUT_MS || "30000"); return { key, model: process.env.GEMINI_MODEL || "gemini-3.7-flash", timeout: Number.isFinite(configuredTimeout) ? Math.min(Math.max(configuredTimeout, 10_000), 60_000) : 30_000 }; }

export async function extractKtpWithGemini(dataUrl: string): Promise<KtpData> {
  const { key, model, timeout } = config();
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[2].length > 15_000_000) throw new Error("Format atau ukuran gambar tidak valid.");
  const request = { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: match[1], data: match[2] } }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } };
  // The UX promises a five-second cap per card. Do not retry/fallback here,
  // since doing so would make a single slow request block the batch queue.
  const models = [model];
  let payload: GeminiResponse | null = null; let lastError = "Gemini API tidak tersedia.";
  for (const candidate of models) {
    for (let attempt = 0; attempt < 1; attempt++) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), cache: "no-store", signal: AbortSignal.timeout(timeout) });
      if (response.ok) { payload = await response.json() as GeminiResponse; break; }
      const detail = await response.text().catch(() => ""); lastError = `Gemini API gagal (${response.status}). ${detail.slice(0, 180)}`;
      if (![429, 500, 502, 503, 504].includes(response.status)) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (payload) break;
  }
  if (!payload) throw new Error(`${lastError} OCR melewati batas waktu. Coba ulangi dengan foto lebih jelas.`);
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = resultSchema.safeParse(JSON.parse(clean));
  if (!parsed.success) throw new Error("Format hasil OCR AI tidak valid.");
  return parsed.data;
}
