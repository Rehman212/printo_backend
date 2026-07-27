import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  /** Absolute folder where image files are written (Next.js public/uploads). */
  getUploadsDir(): string {
    const configured = this.config.get<string>('UPLOADS_DIR')?.trim();
    if (configured) return path.resolve(configured);

    // Default: sibling printoe frontend public/uploads
    return path.resolve(
      process.cwd(),
      '..',
      'printoe',
      'public',
      'uploads',
    );
  }

  ensureUploadsDir(): string {
    const dir = this.getUploadsDir();
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  saveImage(file: Express.Multer.File): { url: string; filename: string; path: string } {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Only image files are allowed (JPEG, PNG, WebP, GIF, SVG)',
      );
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new BadRequestException('Image must be 8MB or smaller');
    }

    const dir = this.ensureUploadsDir();
    const ext = this.extFor(file);
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    const dest = path.join(dir, filename);
    fs.writeFileSync(dest, file.buffer);

    const frontendOrigin = (
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const url = `${frontendOrigin}/uploads/${filename}`;

    return { url, filename, path: dest };
  }

  private extFor(file: Express.Multer.File): string {
    const fromName = path.extname(file.originalname || '').toLowerCase();
    if (fromName && fromName.length <= 5) return fromName;
    switch (file.mimetype) {
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      case 'image/svg+xml':
        return '.svg';
      default:
        return '.jpg';
    }
  }
}
