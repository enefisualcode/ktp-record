import { z } from "zod";
export const ktpSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK harus tepat 16 digit"),
  nama: z.string().trim().min(1).max(120), tempatLahir: z.string().trim().max(80),
  tanggalLahir: z.string().trim().max(20), jenisKelamin: z.string().trim().max(30), golonganDarah: z.string().trim().max(5),
  alamat: z.string().trim().max(250), rt: z.string().trim().max(5), rw: z.string().trim().max(5),
  kelurahanDesa: z.string().trim().max(100), kecamatan: z.string().trim().max(100), agama: z.string().trim().max(40),
  statusPerkawinan: z.string().trim().max(50), pekerjaan: z.string().trim().max(100), kewarganegaraan: z.string().trim().max(50), berlakuHingga: z.string().trim().max(30),
  confirmed: z.literal(true)
});
export type SavePayload = z.infer<typeof ktpSchema>;
