import { emptyKtpData, type KtpData } from "@/types/ktp";
const clean = (v: string) => v.replace(/^[\s:.-]+|[\s:.-]+$/g, "").replace(/\s+/g, " ").trim();
const valueAfter = (lines: string[], labels: RegExp[]) => { for (let i = 0; i < lines.length; i++) { const m = lines[i].match(new RegExp(`^(?:${labels.map(x => x.source).join("|")})\\s*[:=-]?\\s*(.*)$`, "i")); if (m) return clean(m[1] || lines[i + 1] || ""); } return ""; };
export const normalizeNik = (value: string) => value.replace(/.*?N\s*[I1]\s*K\s*[:=-]?/i, "").toUpperCase().replace(/[O]/g, "0").replace(/[IL]/g, "1").replace(/B/g, "8").replace(/[^0-9]/g, "").slice(0, 16);
export const normalizeDate = (value: string) => { const m = value.replace(/[O]/gi, "0").match(/(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})/); if (!m) return ""; const year = m[3].length === 2 ? `19${m[3]}` : m[3]; return `${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}-${year}`; };
export function parseKtp(text: string): KtpData {
  const lines = text.split(/\r?\n/).map(clean).filter(Boolean); const get = (...x: RegExp[]) => valueAfter(lines, x);
  const out = { ...emptyKtpData };
  const nikLine = lines.find(x => /N[I1]K/i.test(x)) || ""; out.nik = normalizeNik(nikLine) || normalizeNik(lines.find(x => normalizeNik(x).length === 16) || "");
  out.nama = get(/nama/); const birth = get(/tempat\s*\/?\s*t(?:gl|anggal)?\s*lahir/, /tempat.*lahir/); const birthMatch = birth.match(/^(.*?)\s*,?\s*(\d{1,2}\D+\d{1,2}\D+\d{2,4})/); out.tempatLahir = clean(birthMatch?.[1] || birth); out.tanggalLahir = normalizeDate(birthMatch?.[2] || birth);
  out.jenisKelamin = get(/jenis\s*kelamin/); out.golonganDarah = get(/gol\.?\s*darah/).toUpperCase(); out.alamat = get(/alamat/);
  const rtrw = get(/rt\s*\/?\s*rw/) || lines.find(x => /\bRT\b.*\bRW\b/i.test(x)) || ""; const pair = rtrw.match(/(\d{1,3})\s*\/?\s*(\d{1,3})/); out.rt = pair?.[1]?.padStart(3,"0") || ""; out.rw = pair?.[2]?.padStart(3,"0") || "";
  out.kelurahanDesa = get(/kel\.?\s*\/?\s*desa/, /kelurahan/, /desa/); out.kecamatan = get(/kecamatan/); out.agama = get(/agama/); out.statusPerkawinan = get(/status\s*perkawinan/); out.pekerjaan = get(/pekerjaan/); out.kewarganegaraan = get(/kewarganegaraan/); out.berlakuHingga = get(/berlaku\s*hingga/);
  return out;
}
