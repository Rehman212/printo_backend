import { Injectable, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  ProofStatus,
  QuoteStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/admin-ops.dto';

@Injectable()
export class AdminOpsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [
      productCount,
      customerCount,
      orderCount,
      revenueAgg,
      openOrders,
      awaitingProofs,
      pendingQuotes,
    ] = await Promise.all([
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.PROCESSING, OrderStatus.PRINTING] },
        },
      }),
      this.prisma.order.count({
        where: { proofStatus: ProofStatus.AWAITING },
      }),
      this.prisma.quote.count({ where: { status: QuoteStatus.PENDING } }),
    ]);

    return {
      success: true,
      data: {
        revenue: revenueAgg._sum.total ?? 0,
        openOrders,
        customers: customerCount,
        products: productCount,
        orders: orderCount,
        awaitingProofs,
        pendingQuotes,
      },
    };
  }

  async listCustomers() {
    const users = await this.prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        createdAt: true,
        orders: { select: { total: true, status: true } },
      },
    });

    return {
      success: true,
      data: users.map((u) => {
        const activeOrders = u.orders.filter(
          (o) => o.status !== OrderStatus.CANCELLED,
        );
        const spent = activeOrders.reduce((s, o) => s + o.total, 0);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          company: u.company || '—',
          orders: activeOrders.length,
          spent,
          status: activeOrders.length > 0 || spent > 0 ? 'active' : 'inactive',
          joined: u.createdAt.toISOString().slice(0, 10),
        };
      }),
    };
  }

  async listProofs() {
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { artworkFile: { not: null } },
          { proofStatus: { not: ProofStatus.NONE } },
        ],
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: orders
        .filter((o) => o.artworkFile || o.proofStatus !== ProofStatus.NONE)
        .map((o) => ({
          id: o.id,
          proofId: `PRF-${o.orderNumber.replace(/\D/g, '').slice(-4) || o.id.slice(-4)}`,
          orderId: o.orderNumber,
          customer: o.shippingName || o.user.name,
          email: o.shippingEmail || o.user.email,
          fileName: o.artworkFile || 'artwork-upload',
          status: this.mapProofStatus(o.proofStatus),
          submitted: o.createdAt.toISOString().slice(0, 10),
        })),
    };
  }

  async updateProofStatus(orderKey: string, status: ProofStatus) {
    const order = await this.findOrder(orderKey);
    if (!order) throw new NotFoundException('Order / proof not found');

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { proofStatus: status },
      include: { user: { select: { name: true, email: true } } },
    });

    return {
      success: true,
      message: 'Proof status updated',
      data: {
        id: updated.id,
        proofId: `PRF-${updated.orderNumber.replace(/\D/g, '').slice(-4) || updated.id.slice(-4)}`,
        orderId: updated.orderNumber,
        customer: updated.shippingName || updated.user.name,
        email: updated.shippingEmail || updated.user.email,
        fileName: updated.artworkFile || 'artwork-upload',
        status: this.mapProofStatus(updated.proofStatus),
        submitted: updated.createdAt.toISOString().slice(0, 10),
      },
    };
  }

  async listQuotes() {
    const quotes = await this.prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: quotes.map((q) => this.mapQuote(q)),
    };
  }

  async createQuote(dto: CreateQuoteDto) {
    const quoteNumber = await this.nextQuoteNumber();
    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail?.trim() || null,
        company: dto.company?.trim() || null,
        productName: dto.productName.trim(),
        quantity: dto.quantity,
        total: dto.total,
        notes: dto.notes?.trim() || null,
      },
    });
    return {
      success: true,
      message: 'Quote created',
      data: this.mapQuote(quote),
    };
  }

  async updateQuoteStatus(id: string, status: QuoteStatus) {
    const existing = await this.prisma.quote.findFirst({
      where: { OR: [{ id }, { quoteNumber: id }] },
    });
    if (!existing) throw new NotFoundException('Quote not found');

    const quote = await this.prisma.quote.update({
      where: { id: existing.id },
      data: { status },
    });

    return {
      success: true,
      message: 'Quote updated',
      data: this.mapQuote(quote),
    };
  }

  async ensureDemoQuotes() {
    const count = await this.prisma.quote.count();
    if (count > 0) return;

    await this.prisma.quote.createMany({
      data: [
        {
          quoteNumber: 'QT-882',
          customerName: 'Lumen Studio',
          customerEmail: 'sarah@lumen.studio',
          company: 'Lumen Studio',
          productName: 'Rigid Product Boxes',
          quantity: 500,
          total: 6490,
          status: QuoteStatus.APPROVED,
        },
        {
          quoteNumber: 'QT-871',
          customerName: 'Northline Co',
          customerEmail: 'marcus@northline.co',
          company: 'Northline Co',
          productName: 'Roll Labels',
          quantity: 10000,
          total: 1890,
          status: QuoteStatus.PENDING,
        },
        {
          quoteNumber: 'QT-865',
          customerName: 'Brightbox',
          customerEmail: 'priya@brightbox.io',
          company: 'Brightbox',
          productName: 'Vinyl Banners',
          quantity: 12,
          total: 420,
          status: QuoteStatus.DECLINED,
        },
      ],
    });
  }

  async ensureDemoProofs() {
    const existing = await this.prisma.order.count({
      where: {
        OR: [
          { artworkFile: { not: null } },
          { proofStatus: { not: ProofStatus.NONE } },
        ],
      },
    });
    if (existing > 0) return;

    let user = await this.prisma.user.findFirst({
      where: { role: Role.CUSTOMER },
    });
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { role: Role.ADMIN },
      });
    }
    if (!user) return;

    const demos = [
      {
        orderNumber: 'ORD-10482',
        file: 'cards-front.pdf',
        status: ProofStatus.AWAITING,
        name: 'Sarah Chen',
        email: 'sarah@lumen.studio',
        product: 'Standard Business Cards',
      },
      {
        orderNumber: 'ORD-10471',
        file: 'banner-v3.png',
        status: ProofStatus.APPROVED,
        name: 'Marcus Webb',
        email: 'marcus@northline.co',
        product: 'Vinyl Banners',
      },
      {
        orderNumber: 'ORD-10440',
        file: 'sticker-diecut.ai',
        status: ProofStatus.CHANGES,
        name: 'Priya Patel',
        email: 'priya@brightbox.io',
        product: 'Die-Cut Stickers',
      },
    ];

    for (const d of demos) {
      const clash = await this.prisma.order.findUnique({
        where: { orderNumber: d.orderNumber },
      });
      if (clash) continue;
      await this.prisma.order.create({
        data: {
          orderNumber: d.orderNumber,
          userId: user.id,
          status: OrderStatus.PROCESSING,
          subtotal: 120,
          total: 120,
          shippingName: d.name,
          shippingEmail: d.email,
          artworkFile: d.file,
          proofStatus: d.status,
          items: {
            create: [
              {
                name: d.product,
                quantity: 1,
                unitPrice: 120,
              },
            ],
          },
        },
      });
    }
  }

  async backfillProofsFromArtwork() {
    await this.prisma.order.updateMany({
      where: {
        artworkFile: { not: null },
        proofStatus: ProofStatus.NONE,
      },
      data: { proofStatus: ProofStatus.AWAITING },
    });
  }

  private async findOrder(orderKey: string) {
    return this.prisma.order.findFirst({
      where: { OR: [{ id: orderKey }, { orderNumber: orderKey }] },
    });
  }

  private async nextQuoteNumber() {
    const n = Math.floor(100 + Math.random() * 900);
    return `QT-${n}${Date.now().toString().slice(-3)}`;
  }

  private mapProofStatus(status: ProofStatus) {
    if (status === ProofStatus.APPROVED) return 'approved' as const;
    if (status === ProofStatus.CHANGES) return 'changes' as const;
    if (status === ProofStatus.AWAITING) return 'awaiting' as const;
    return 'awaiting' as const;
  }

  private mapQuote(q: {
    id: string;
    quoteNumber: string;
    customerName: string;
    customerEmail: string | null;
    company: string | null;
    productName: string;
    quantity: number;
    total: number;
    status: QuoteStatus;
    createdAt: Date;
  }) {
    return {
      id: q.quoteNumber,
      dbId: q.id,
      customer: q.customerName,
      email: q.customerEmail,
      company: q.company,
      product: q.productName,
      qty: q.quantity,
      total: q.total,
      status: q.status.toLowerCase() as 'pending' | 'approved' | 'declined',
      date: q.createdAt.toISOString().slice(0, 10),
    };
  }
}
