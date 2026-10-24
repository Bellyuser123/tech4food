import crypto from 'crypto';
import QRCode from 'qrcode';

export interface QrTokenMetadata {
  id: string;
  restaurantId: string;
  branchId: string;
  tokenHash: string;
  tokenType: 'table' | 'order';
  targetReference: string; // e.g. 'Table 04' or orderId
  expiresAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

export interface GeneratedQrResult {
  rawToken: string;
  tokenHash: string;
  deepLinkUrl: string;
  qrDataUrl: string;
  qrSvg: string;
}

export class QrService {
  /**
   * Generates a 256-bit cryptographically secure opaque token.
   * Format: base64url string (43 characters), URL-safe and collision-free.
   */
  public static generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Computes SHA-256 hash of a raw token for safe database persistence.
   * Prevents raw tokens from being exposed if database logs or dumps are compromised.
   */
  public static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
  }

  /**
   * Generates a complete QR code payload including deep link, PNG Data URL, and SVG markup.
   */
  public static async generateQrCode(
    baseUrl: string,
    rawToken: string,
    type: 'table' | 'order'
  ): Promise<GeneratedQrResult> {
    const tokenHash = this.hashToken(rawToken);
    // Deep link URL never includes personal customer data (names, emails, phones)
    const deepLinkUrl = `${baseUrl.replace(/\/+$/, '')}/qr?token=${encodeURIComponent(rawToken)}&type=${type}`;

    const [qrDataUrl, qrSvg] = await Promise.all([
      QRCode.toDataURL(deepLinkUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
        color: {
          dark: '#7F1D1D', // Burgundy-900 brand accent
          light: '#FFFDF9', // Warm cream background
        },
      }),
      QRCode.toString(deepLinkUrl, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#7F1D1D',
          light: '#FFFDF9',
        },
      }),
    ]);

    return {
      rawToken,
      tokenHash,
      deepLinkUrl,
      qrDataUrl,
      qrSvg,
    };
  }
}
