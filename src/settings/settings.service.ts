import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSiteSettingsDto } from './dto/settings.dto';

const DEFAULT_ID = 'default';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate() {
    const existing = await this.prisma.siteSettings.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (existing) return existing;
    return this.prisma.siteSettings.create({
      data: { id: DEFAULT_ID },
    });
  }

  async getPublic() {
    const s = await this.getOrCreate();
    return {
      storeName: s.storeName,
      tagline: s.tagline,
      description: s.description,
      logoUrl: s.logoUrl,
      faviconUrl: s.faviconUrl,
      primaryColor: s.primaryColor,
      supportEmail: s.supportEmail,
      supportPhone: s.supportPhone,
      address: s.address,
      businessHours: s.businessHours,
      websiteUrl: s.websiteUrl,
      seoTitleTemplate: s.seoTitleTemplate,
      seoDefaultDescription: s.seoDefaultDescription,
      seoOgImageUrl: s.seoOgImageUrl,
      googleAnalyticsId: s.googleAnalyticsId,
      googleSearchConsole: s.googleSearchConsole,
      googleTagManagerId: s.googleTagManagerId,
      metaPixelId: s.metaPixelId,
      headerHtml: s.headerHtml,
      bodyHtml: s.bodyHtml,
      currency: s.currency,
      currencySymbol: s.currencySymbol,
      timezone: s.timezone,
      taxNote: s.taxNote,
      shippingNote: s.shippingNote,
      minOrderAmount: s.minOrderAmount,
      requireProof: s.requireProof,
      allowGuestCheckout: s.allowGuestCheckout,
      socialInstagram: s.socialInstagram,
      socialFacebook: s.socialFacebook,
      socialLinkedin: s.socialLinkedin,
      socialTwitter: s.socialTwitter,
      socialYoutube: s.socialYoutube,
      maintenanceMode: s.maintenanceMode,
      maintenanceMessage: s.maintenanceMessage,
    };
  }

  async getAdmin() {
    return this.getOrCreate();
  }

  async update(dto: UpdateSiteSettingsDto) {
    await this.getOrCreate();
    const data = await this.prisma.siteSettings.update({
      where: { id: DEFAULT_ID },
      data: {
        ...dto,
        logoUrl: dto.logoUrl === '' ? null : dto.logoUrl,
        faviconUrl: dto.faviconUrl === '' ? null : dto.faviconUrl,
        seoOgImageUrl: dto.seoOgImageUrl === '' ? null : dto.seoOgImageUrl,
        googleAnalyticsId:
          dto.googleAnalyticsId === '' ? null : dto.googleAnalyticsId,
        googleSearchConsole:
          dto.googleSearchConsole === '' ? null : dto.googleSearchConsole,
        googleTagManagerId:
          dto.googleTagManagerId === '' ? null : dto.googleTagManagerId,
        metaPixelId: dto.metaPixelId === '' ? null : dto.metaPixelId,
        headerHtml: dto.headerHtml === '' ? null : dto.headerHtml,
        bodyHtml: dto.bodyHtml === '' ? null : dto.bodyHtml,
        taxNote: dto.taxNote === '' ? null : dto.taxNote,
        shippingNote: dto.shippingNote === '' ? null : dto.shippingNote,
        adminNotifyEmails:
          dto.adminNotifyEmails === '' ? null : dto.adminNotifyEmails,
        socialInstagram:
          dto.socialInstagram === '' ? null : dto.socialInstagram,
        socialFacebook: dto.socialFacebook === '' ? null : dto.socialFacebook,
        socialLinkedin: dto.socialLinkedin === '' ? null : dto.socialLinkedin,
        socialTwitter: dto.socialTwitter === '' ? null : dto.socialTwitter,
        socialYoutube: dto.socialYoutube === '' ? null : dto.socialYoutube,
      },
    });
    return { success: true, message: 'Settings saved', data };
  }

  /** Resolve admin notify emails (comma-separated) or fall back to support email. */
  async getNotifyEmails(): Promise<string[]> {
    const s = await this.getOrCreate();
    const raw = (s.adminNotifyEmails || s.supportEmail || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    return [...new Set(raw)];
  }

  async notifyAdmins(
    event: 'order' | 'quote' | 'proof',
    subject: string,
    detail: string,
  ) {
    const s = await this.getOrCreate();
    const enabled =
      event === 'order'
        ? s.emailOnOrders
        : event === 'quote'
          ? s.emailOnQuotes
          : s.emailOnProofs;
    if (!enabled) return { sent: false, reason: 'disabled' as const };

    const emails = await this.getNotifyEmails();
    this.logger.log(
      `[notify:${event}] ${subject} → ${emails.join(', ') || '(no recipients)'} | ${detail}`,
    );
    return { sent: true as const, emails, subject, detail };
  }
}
