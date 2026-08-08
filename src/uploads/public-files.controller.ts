import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ARTWORK_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/tiff',
  'application/pdf',
]);

@Controller('files')
export class PublicFilesController {
  private artworkDir() {
    const dir = path.resolve(process.cwd(), 'uploads', 'artwork');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  @Get('artwork/:name')
  serveArtwork(@Param('name') name: string, @Res() res: Response) {
    const safe = path.basename(decodeURIComponent(name));
    const filePath = path.join(this.artworkDir(), safe);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Artwork file not found');
    }
    return res.sendFile(filePath);
  }

  @Post('artwork')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 40 * 1024 * 1024 },
    }),
  )
  uploadArtwork(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No artwork file uploaded');
    const ok =
      ARTWORK_MIME.has(file.mimetype) ||
      /\.(png|jpe?g|gif|webp|svg|tiff?|pdf)$/i.test(file.originalname || '');
    if (!ok) {
      throw new BadRequestException(
        'Only image or PDF files are allowed for artwork proofs',
      );
    }

    const ext =
      path.extname(file.originalname || '').toLowerCase() ||
      (file.mimetype === 'application/pdf' ? '.pdf' : '.png');
    const safeBase = (file.originalname || 'artwork')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBase || `file${ext}`}`;
    const dest = path.join(this.artworkDir(), filename);
    fs.writeFileSync(dest, file.buffer);

    const apiOrigin = (
      process.env.API_PUBLIC_URL ||
      `http://localhost:${process.env.PORT || 4000}`
    ).replace(/\/$/, '');
    const url = `${apiOrigin}/api/files/artwork/${encodeURIComponent(filename)}`;

    return {
      success: true,
      message: 'Artwork uploaded',
      data: {
        url,
        filename: file.originalname,
        storedName: filename,
        size: file.size,
        type: file.mimetype,
      },
    };
  }
}
