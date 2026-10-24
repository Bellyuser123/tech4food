import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory path
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface StoredFileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
}

export class StorageService {
  private static allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private static maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  public static async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<StoredFileMetadata> {
    if (!this.allowedMimeTypes.includes(mimeType.toLowerCase())) {
      throw new Error(
        `Invalid file format '${mimeType}'. Allowed formats: JPEG, PNG, WebP, GIF.`
      );
    }

    if (fileBuffer.length > this.maxSizeBytes) {
      throw new Error('File exceeds maximum permitted size of 5MB.');
    }

    const fileId = crypto.randomUUID();
    const ext = path.extname(originalName) || `.${mimeType.split('/')[1] || 'png'}`;
    const safeFileName = `${fileId}${ext}`;
    const destinationPath = path.join(UPLOAD_DIR, safeFileName);

    await fs.promises.writeFile(destinationPath, fileBuffer);

    const metadata: StoredFileMetadata = {
      id: fileId,
      originalName,
      fileName: safeFileName,
      mimeType,
      sizeBytes: fileBuffer.length,
      url: `/uploads/${safeFileName}`,
      uploadedAt: new Date().toISOString(),
    };

    return metadata;
  }

  public static async saveBase64(
    base64DataUrl: string,
    fallbackName: string = 'uploaded_image.png'
  ): Promise<StoredFileMetadata> {
    const matches = base64DataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image data URI format.');
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    return this.saveFile(buffer, fallbackName, mimeType);
  }

  public static getUploadDir(): string {
    return UPLOAD_DIR;
  }
}
