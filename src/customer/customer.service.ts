import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  ProofStatus,
  QuoteStatus,
  TicketStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCustomerQuoteDto,
  CreateSavedDesignDto,
  CreateTicketDto,
  CreateWishlistDto,
} from './dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string) {
    const [orders, quotes, wishlistCount, designsCount, ticketsOpen] =
      await Promise.all([
        this.prisma.order.findMany({
          where: { userId },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.quote.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.wishlistItem.count({ where: { userId } }),
        this.prisma.savedDesign.count({ where: { userId } }),
        this.prisma.supportTicket.count({
          where: {
            userId,
            status: { in: [TicketStatus.OPEN, TicketStatus.PENDING] },
          },
        }),
      ]);

    const activeStatuses: OrderStatus[] = [
      OrderStatus.PROCESSING,
      OrderStatus.PRINTING,
      OrderStatus.SHIPPED,
    ];
    const activeOrders = orders.filter((o) =>
      activeStatuses.includes(o.status),
    );
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const spend30d = orders
      .filter(
        (o) =>
          o.createdAt >= since && o.status !== OrderStatus.CANCELLED,
      )
      .reduce((s, o) => s + o.total, 0);

    const openQuotes = quotes.filter((q) => q.status === QuoteStatus.PENDING);

    const statusBreakdown = {
      processing: orders.filter((o) => o.status === OrderStatus.PROCESSING)
        .length,
      printing: orders.filter((o) => o.status === OrderStatus.PRINTING).length,
      shipped: orders.filter((o) => o.status === OrderStatus.SHIPPED).length,
      delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED)
        .length,
      cancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED)
        .length,
    };

    const recentOrders = orders.slice(0, 8).map((o) => this.mapOrderRow(o));
    const activity = this.buildActivity(orders, quotes).slice(0, 8);

    // monthly spend last 7 months
    const monthlySpend: Array<{ month: string; spend: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString('en', { month: 'short' });
      const spend = orders
        .filter((o) => {
          const same =
            o.createdAt.getFullYear() === d.getFullYear() &&
            o.createdAt.getMonth() === d.getMonth();
          return same && o.status !== OrderStatus.CANCELLED;
        })
        .reduce((s, o) => s + o.total, 0);
      monthlySpend.push({ month: label, spend });
      void key;
    }

    return {
      success: true,
      data: {
        metrics: {
          activeOrders: activeOrders.length,
          spend30d,
          savedDesigns: designsCount,
          openQuotes: openQuotes.length,
          wishlist: wishlistCount,
          openTickets: ticketsOpen,
        },
        statusBreakdown,
        monthlySpend,
        recentOrders,
        activity,
        quotes: quotes.slice(0, 5).map((q) => this.mapQuote(q)),
      },
    };
  }

  async listQuotes(userId: string) {
    const quotes = await this.prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: quotes.map((q) => this.mapQuote(q)) };
  }

  async createQuote(userId: string, dto: CreateCustomerQuoteDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const quoteNumber = `QT-${Math.floor(100 + Math.random() * 900)}${Date.now()
      .toString()
      .slice(-3)}`;

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        customerName: user.name,
        customerEmail: user.email,
        company: dto.company?.trim() || user.company,
        productName: dto.productName.trim(),
        quantity: dto.quantity,
        total: dto.total,
        notes: dto.notes?.trim() || null,
        userId,
        status: QuoteStatus.PENDING,
      },
    });

    return {
      success: true,
      message: 'Quote submitted',
      data: this.mapQuote(quote),
    };
  }

  async listDownloads(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        OR: [
          { artworkFile: { not: null } },
          { proofStatus: { not: ProofStatus.NONE } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: orders.map((o) => ({
        id: o.id,
        orderId: o.orderNumber,
        fileName: o.artworkFile || 'artwork',
        proofStatus: String(o.proofStatus).toLowerCase(),
        status: String(o.status).toLowerCase(),
        date: o.updatedAt.toISOString().slice(0, 10),
      })),
    };
  }

  async listInvoices(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        status: { not: OrderStatus.CANCELLED },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: orders.map((o) => ({
        id: `INV-${o.orderNumber.replace(/\D/g, '') || o.id.slice(-4)}`,
        orderId: o.orderNumber,
        date: o.createdAt.toISOString().slice(0, 10),
        amount: o.total,
        status:
          o.status === OrderStatus.DELIVERED || o.status === OrderStatus.SHIPPED
            ? 'paid'
            : 'pending',
      })),
    };
  }

  async listNotifications(userId: string) {
    const [orders, quotes, tickets] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.quote.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      this.prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    const items = [
      ...orders.map((o) => ({
        id: `ord-${o.id}`,
        title: `Order ${o.orderNumber} is ${String(o.status).toLowerCase()}`,
        read: false,
        createdAt: o.updatedAt.toISOString(),
      })),
      ...quotes.map((q) => ({
        id: `qt-${q.id}`,
        title: `Quote ${q.quoteNumber} is ${String(q.status).toLowerCase()}`,
        read: q.status !== QuoteStatus.PENDING,
        createdAt: q.updatedAt.toISOString(),
      })),
      ...tickets.map((t) => ({
        id: `tk-${t.id}`,
        title: `Ticket ${t.ticketNumber}: ${t.subject}`,
        read: t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED,
        createdAt: t.updatedAt.toISOString(),
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return { success: true, data: items.slice(0, 20) };
  }

  async listWishlist(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const slugsNeedingProduct = items
      .filter((i) => !i.imageUrl || i.basePrice == null || !i.productId)
      .map((i) => i.productSlug);

    const products =
      slugsNeedingProduct.length > 0
        ? await this.prisma.product.findMany({
            where: { slug: { in: [...new Set(slugsNeedingProduct)] } },
            select: {
              id: true,
              slug: true,
              imageUrl: true,
              basePrice: true,
            },
          })
        : [];

    const bySlug = new Map(products.map((p) => [p.slug, p]));

    const data = await Promise.all(
      items.map(async (item) => {
        const product = bySlug.get(item.productSlug);
        const imageUrl = item.imageUrl || product?.imageUrl || null;
        const basePrice = item.basePrice ?? product?.basePrice ?? null;
        const productId = item.productId || product?.id || null;

        // Backfill missing fields so next load is complete
        if (
          product &&
          (item.imageUrl !== imageUrl ||
            item.basePrice !== basePrice ||
            item.productId !== productId)
        ) {
          await this.prisma.wishlistItem.update({
            where: { id: item.id },
            data: { imageUrl, basePrice, productId },
          });
        }

        return {
          ...item,
          imageUrl,
          basePrice,
          productId,
        };
      }),
    );

    return { success: true, data };
  }

  async addWishlist(userId: string, dto: CreateWishlistDto) {
    const item = await this.prisma.wishlistItem.upsert({
      where: {
        userId_productSlug: {
          userId,
          productSlug: dto.productSlug,
        },
      },
      update: {
        name: dto.name,
        imageUrl: dto.imageUrl,
        basePrice: dto.basePrice,
        productId: dto.productId,
      },
      create: {
        userId,
        productSlug: dto.productSlug,
        name: dto.name,
        imageUrl: dto.imageUrl,
        basePrice: dto.basePrice,
        productId: dto.productId,
      },
    });
    return { success: true, message: 'Saved to wishlist', data: item };
  }

  async removeWishlist(userId: string, id: string) {
    const existing = await this.prisma.wishlistItem.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Wishlist item not found');
    await this.prisma.wishlistItem.delete({ where: { id } });
    return { success: true, message: 'Removed from wishlist', data: { id } };
  }

  async listTickets(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: tickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        message: t.message,
        status: String(t.status).toLowerCase(),
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  async createTicket(userId: string, dto: CreateTicketDto) {
    const ticketNumber = `TK-${Math.floor(100 + Math.random() * 900)}${Date.now()
      .toString()
      .slice(-3)}`;
    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
      },
    });
    return {
      success: true,
      message: 'Ticket opened',
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        message: ticket.message,
        status: String(ticket.status).toLowerCase(),
        createdAt: ticket.createdAt.toISOString(),
      },
    };
  }

  async listDesigns(userId: string) {
    const designs = await this.prisma.savedDesign.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    // Collapse legacy duplicates (same product + same options fingerprint / productName)
    const seen = new Set<string>();
    const unique: typeof designs = [];
    const removeIds: string[] = [];
    for (const d of designs) {
      const fingerprint = d.previewUrl?.startsWith('options:')
        ? d.previewUrl
        : `name:${d.productSlug ?? ''}:${d.productName ?? d.name}`;
      const key = `${d.productSlug ?? 'custom'}::${fingerprint}`;
      if (seen.has(key)) {
        removeIds.push(d.id);
        continue;
      }
      seen.add(key);
      unique.push(d);
    }
    if (removeIds.length) {
      await this.prisma.savedDesign.deleteMany({
        where: { id: { in: removeIds } },
      });
    }

    return { success: true, data: unique };
  }

  async createDesign(userId: string, dto: CreateSavedDesignDto) {
    const productSlug = dto.productSlug?.trim() || null;
    const optionsKey = (dto.optionsKey ?? '').trim();
    const name = dto.name.trim();
    const productName = dto.productName?.trim() || null;
    // Store options fingerprint in previewUrl (no extra DB column required)
    const previewUrl =
      dto.previewUrl?.trim() ||
      (optionsKey ? `options:${optionsKey}` : null);

    if (productSlug) {
      const candidates = await this.prisma.savedDesign.findMany({
        where: { userId, productSlug },
        orderBy: { updatedAt: 'desc' },
      });

      const match =
        candidates.find((d) => {
          if (optionsKey) {
            return (
              d.previewUrl === `options:${optionsKey}` ||
              d.previewUrl === optionsKey
            );
          }
          return d.productName === productName;
        }) ?? candidates.find((d) => d.productName === productName);

      if (match) {
        const dupes = candidates.filter(
          (d) =>
            d.id !== match.id &&
            (d.previewUrl === match.previewUrl ||
              d.productName === match.productName),
        );
        if (dupes.length) {
          await this.prisma.savedDesign.deleteMany({
            where: { id: { in: dupes.map((d) => d.id) } },
          });
        }

        const design = await this.prisma.savedDesign.update({
          where: { id: match.id },
          data: { name, productName, previewUrl },
        });
        return {
          success: true,
          message: 'Design already saved',
          data: design,
          alreadySaved: true,
        };
      }
    }

    const design = await this.prisma.savedDesign.create({
      data: {
        userId,
        name,
        productSlug,
        productName,
        previewUrl,
      },
    });
    return {
      success: true,
      message: 'Design saved',
      data: design,
      alreadySaved: false,
    };
  }

  async deleteDesign(userId: string, id: string) {
    const existing = await this.prisma.savedDesign.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Design not found');
    await this.prisma.savedDesign.delete({ where: { id } });
    return { success: true, data: { id } };
  }

  private mapOrderRow(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    createdAt: Date;
    items: Array<{ name: string; quantity: number }>;
  }) {
    const primary = order.items[0];
    const qty = order.items.reduce((s, i) => s + i.quantity, 0);
    return {
      id: order.orderNumber,
      dbId: order.id,
      product: primary?.name ?? 'Print order',
      quantity: qty,
      status: String(order.status).toLowerCase(),
      date: order.createdAt.toISOString().slice(0, 10),
      total: order.total,
      itemCount: order.items.length,
    };
  }

  private mapQuote(q: {
    id: string;
    quoteNumber: string;
    productName: string;
    quantity: number;
    total: number;
    status: QuoteStatus;
    createdAt: Date;
  }) {
    return {
      id: q.quoteNumber,
      dbId: q.id,
      product: q.productName,
      qty: q.quantity,
      total: q.total,
      status: String(q.status).toLowerCase() as
        | 'pending'
        | 'approved'
        | 'declined',
      date: q.createdAt.toISOString().slice(0, 10),
    };
  }

  private buildActivity(
    orders: Array<{
      orderNumber: string;
      status: OrderStatus;
      updatedAt: Date;
    }>,
    quotes: Array<{
      quoteNumber: string;
      status: QuoteStatus;
      updatedAt: Date;
    }>,
  ) {
    return [
      ...orders.map((o) => ({
        id: `o-${o.orderNumber}`,
        text: `Order ${o.orderNumber} is ${String(o.status).toLowerCase()}`,
        time: o.updatedAt.toISOString(),
        color:
          o.status === OrderStatus.DELIVERED
            ? 'bg-success'
            : o.status === OrderStatus.PRINTING
              ? 'bg-primary'
              : 'bg-accent',
      })),
      ...quotes.map((q) => ({
        id: `q-${q.quoteNumber}`,
        text: `Quote ${q.quoteNumber} ${String(q.status).toLowerCase()}`,
        time: q.updatedAt.toISOString(),
        color: 'bg-brand-yellow',
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }
}
