import { google } from "googleapis";
import { Readable } from "node:stream";

function driveConfig() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!email || !key || !folderId) throw new Error("Google Drive belum dikonfigurasi: isi GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, dan GOOGLE_DRIVE_FOLDER_ID.");
  return { email, key, folderId };
}

function parseImage(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Format foto tidak valid.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 3 * 1024 * 1024) throw new Error("Foto terlalu besar untuk disimpan ke Google Drive.");
  return { mimeType: match[1], bytes };
}

export async function uploadKtpPhoto(photo: string, nik: string) {
  const { email, key, folderId } = driveConfig(); const image = parseImage(photo);
  const auth = new google.auth.JWT(email, undefined, key, ["https://www.googleapis.com/auth/drive.file"]);
  const drive = google.drive({ version: "v3", auth });
  const extension = image.mimeType === "image/png" ? "png" : image.mimeType === "image/webp" ? "webp" : "jpg";
  const result = await drive.files.create({ requestBody: { name: `KTP-${nik}-${Date.now()}.${extension}`, parents: [folderId] }, media: { mimeType: image.mimeType, body: Readable.from(image.bytes) }, fields: "id,webViewLink" });
  const id = result.data.id; if (!id) throw new Error("Google Drive tidak mengembalikan ID file.");
  return result.data.webViewLink || `https://drive.google.com/file/d/${id}/view`;
}
