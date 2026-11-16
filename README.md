# KTP Reader

Aplikasi pribadi untuk mengekstrak foto KTP Indonesia dengan OCR AI Gemini, lalu menyimpan data yang sudah diperiksa ke Google Sheets. Karena prioritas akurasi, foto dikirim sementara ke endpoint server dan Gemini; API key tetap server-side, dan hanya field formulir yang dikonfirmasi pengguna diteruskan ke Sheets.

## Menjalankan lokal

1. Gunakan Node.js 20 atau lebih baru, lalu jalankan `npm install`.
2. Salin `.env.example` menjadi `.env.local` dan isi seluruh variabelnya.
3. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.
4. Validasi rilis dengan `npm run lint`, `npm test`, dan `npm run build`.

Untuk membuat nilai rahasia yang kuat: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Gunakan output berbeda untuk `APP_PASSWORD` dan `SESSION_SECRET` (session secret minimal 32 karakter).

## Konfigurasi Google Sheets

1. Buat project di [Google Cloud Console](https://console.cloud.google.com/), kemudian aktifkan **Google Sheets API**.
2. Di **IAM & Admin → Service Accounts**, buat service account, lalu buat JSON key baru. Jangan commit atau unggah JSON key tersebut.
3. Dari JSON key, salin `client_email` ke `GOOGLE_CLIENT_EMAIL` dan `private_key` ke `GOOGLE_PRIVATE_KEY`. Jika disimpan satu baris di Vercel, pertahankan literal `\\n`; aplikasi mengubahnya menjadi newline di server.
4. Buka spreadsheet yang disediakan dan bagikan ke email service account dengan peran **Editor**.
5. Pertahankan `GOOGLE_SHEET_ID` dan `GOOGLE_SHEET_NAME=Sheet1` sebagaimana pada `.env.example`.
6. Buat folder khusus KTP di Google Drive, salin ID folder dari URL, isi ke `GOOGLE_DRIVE_FOLDER_ID`, lalu bagikan folder tersebut ke email service account sebagai **Editor**. Saat menyimpan, aplikasi mengunggah foto yang telah dikonfirmasi ke folder ini dan menambahkan kolom `LINK FOTO KTP` (kolom S) secara otomatis pada spreadsheet.

## Konfigurasi OCR AI Gemini

Buat Gemini API key di Google AI Studio, kemudian isi `GEMINI_API_KEY` pada `.env.local` atau Environment Variables Vercel. Model default adalah `gemini-2.5-flash` dan dapat diganti melalui `GEMINI_MODEL`. Foto KTP dikirim hanya saat tombol **Mulai Scan** ditekan, tidak ditulis ke log atau storage aplikasi, dan hasilnya tetap harus diperiksa manual. Tanpa API key, endpoint OCR AI akan menolak permintaan.

Endpoint `/api/ktp/save` memeriksa kolom B sebelum menambahkan baris baru, menyimpan NIK sebagai string melalui `RAW`, memakai waktu `Asia/Jakarta`, dan menambahkan status `DIPERIKSA PENGGUNA`. Ini adalah deduplikasi terbaik tanpa database: dua request yang benar-benar bersamaan masih dapat lolos pemeriksaan sebelum salah satunya melakukan append. Untuk jaminan atomik diperlukan locking terpusat/database atau Google Apps Script dengan lock.

## Deploy ke Vercel

Push repo ke Git lalu impor proyek di Vercel (framework akan terdeteksi sebagai Next.js). Tambahkan setiap variabel `.env.local` melalui **Project Settings → Environment Variables** untuk Production/Preview yang diperlukan, lalu deploy. Jangan pernah menaruh private key pada variabel `NEXT_PUBLIC_*`.

## Menguji dengan aman

Gunakan gambar KTP sintetis dan nama/NIK fiktif. Unit test parser memakai data sintetis. Untuk uji end-to-end, pastikan spreadsheet uji dibagikan ke service account dan gunakan NIK sintetis yang belum ada. Aplikasi tidak memiliki fixtures identitas nyata.

## Catatan OCR dan privasi

Gemini Vision digunakan untuk memahami layout KTP dan mengembalikan JSON field. Pencahayaan merata, gambar tajam, KTP memenuhi frame, dan opsi grayscale/kontras biasanya membantu. Hasil OCR bukan bukti identitas resmi: periksa seluruh field—khususnya NIK—sebelum memberi konfirmasi. Data yang tak terbaca dikosongkan; aplikasi meminta model untuk tidak mengarang nilai. Tidak ada localStorage, sessionStorage, IndexedDB, analytics, penyimpanan foto, maupun logging data KTP; namun gambar tetap diproses oleh layanan Gemini sesuai konfigurasi akun/API Anda.

## Keamanan

Login menggunakan password environment yang divalidasi server dan cookie HttpOnly bertanda tangan (SameSite=Lax, Secure di production) dengan masa berlaku 8 jam. Endpoint mutasi memeriksa session, Origin, content type, payload terukur, serta Zod. Percobaan login dibatasi per instance proses (pada deployment serverless ini bukan rate limit global; gunakan layanan rate-limit bersama bila dibutuhkan untuk skala lebih luas).
