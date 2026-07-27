import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, ProofStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto, CheckoutItemDto } from './dto/checkout.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOrderNumber() {
    const n = Math.floor(10000 + Math.random() * 90000);
    return `PR-${n}`;
  }

  private mapStatus(status: OrderStatus) {
    return status.toLowerCase() as
      | 'processing'
      | 'printing'
      | 'shipped'
      | 'delivered'
      | 'cancelled';
  }

  private toAdminRow(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    createdAt: Date;
    shippingName: string | null;
    shippingEmail: string | null;
    user: { name: string; email: string };
    items: Array<{ name: string; quantity: number }>;
  }) {
    const primary = order.items[0];
    const qty = order.items.reduce((s, i) => s + i.quantity, 0);
    return {
      id: order.orderNumber,
      dbId: order.id,
      product: primary?.name ?? 'Print order',
      quantity: qty,
      status: this.mapStatus(order.status),
      date: order.createdAt.toISOString().slice(0, 10),
      total: order.total,
      customer: order.shippingName || order.user.name,
      email: order.shippingEmail || order.user.email,
      itemCount: order.items.length,
    };
  }

  private toDetail(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    notes: string | null;
    shippingName: string | null;
    shippingEmail: string | null;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingState: string | null;
    shippingZip: string | null;
    shippingMethod: string | null;
    paymentMethod: string | null;
    artworkFile: string | null;
    proofStatus?: ProofStatus;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string; email: string };
    items: Array<{
      id: string;
      productId: string | null;
      productSlug: string | null;
      name: string;
      image: string;
      imageUrl: string | null;
      quantity: number;
      unitPrice: number;
      size: string;
      material: string;
      finishing: string;
    }>;
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: this.mapStatus(order.status),
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      notes: order.notes,
      shippingName: order.shippingName,
      shippingEmail: order.shippingEmail,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingZip: order.shippingZip,
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      artworkFile: order.artworkFile,
      proofStatus: order.proofStatus
        ? String(order.proofStatus).toLowerCase()
        : 'none',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },
      items: order.items,
    };
  }

  async placeOrder(userId: string, dto: CheckoutDto) {
    let lines: CheckoutItemDto[] = dto.items ?? [];

    if (!lines.length) {
      const cart = await this.prisma.cartItem.findMany({ where: { userId } });
      lines = cart.map((c) => ({
        productId: c.productId ?? undefined,
        productSlug: c.productSlug ?? undefined,
        name: c.name,
        image: c.image,
        imageUrl: c.imageUrl ?? undefined,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        size: c.size,
        material: c.material,
        finishing: c.finishing,
      }));
    }

    if (!lines.length) {
      throw new BadRequestException('No items to checkout');
    }

    const subtotal =
      dto.subtotal ??
      lines.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const shipping = dto.shipping ?? 0;
    const tax = dto.tax ?? 0;
    const discount = dto.discount ?? 0;
    const total = dto.total;

    let orderNumber = this.generateOrderNumber();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await this.prisma.order.findUnique({
        where: { orderNumber },
      });
      if (!clash) break;
      orderNumber = this.generateOrderNumber();
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PROCESSING,
          subtotal,
          shipping,
          tax,
          discount,
          total,
          notes: dto.notes,
          shippingName: dto.shippingName,
          shippingEmail: dto.shippingEmail,
          shippingAddress: dto.shippingAddress,
          shippingCity: dto.shippingCity,
          shippingState: dto.shippingState,
          shippingZip: dto.shippingZip,
          shippingMethod: dto.shippingMethod,
          paymentMethod: dto.paymentMethod,
          artworkFile: dto.artworkFile,
          proofStatus: dto.artworkFile
            ? ProofStatus.AWAITING
            : ProofStatus.NONE,
          items: {
            create: lines.map((i) => ({
              productId: i.productId,
              productSlug: i.productSlug,
              name: i.name,
              image: i.image ?? 'default',
              imageUrl: i.imageUrl,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              size: i.size ?? '',
              material: i.material ?? '',
              finishing: i.finishing ?? '',
            })),
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
        },
      });

      if (dto.clearCart !== false) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      return created;
    });

    return {
      success: true,
      message: 'Order placed',
      data: {
        orderId: order.orderNumber,
        id: order.id,
        status: this.mapStatus(order.status),
        total: order.total,
        itemCount: order.items.length,
        order: this.toDetail(order),
      },
    };
  }

  async listForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: orders.map((o) => this.toAdminRow(o)),
    };
  }

  async listAll(status?: string) {
    const where: Prisma.OrderWhereInput = {};
    if (status) {
      const upper = status.toUpperCase() as OrderStatus;
      if (Object.values(OrderStatus).includes(upper)) {
        where.status = upper;
      }
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: orders.map((o) => this.toAdminRow(o)),
    };
  }

  async updateStatus(idOrNumber: string, status: OrderStatus) {
    const existing = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
      },
    });
    if (!existing) throw new NotFoundException('Order not found');

    const order = await this.prisma.order.update({
      where: { id: existing.id },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
    });

    return {
      success: true,
      message: 'Order status updated',
      data: this.toAdminRow(order),
    };
  }

  async getOne(idOrNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return { success: true, data: this.toDetail(order) };
  }
}
