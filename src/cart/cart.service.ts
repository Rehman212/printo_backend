import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );

    return {
      success: true,
      data: {
        items,
        itemCount,
        subtotal,
      },
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const size = dto.size ?? '';
    const material = dto.material ?? '';
    const finishing = dto.finishing ?? '';

    // Merge matching line (same product + options)
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        userId,
        name: dto.name,
        size,
        material,
        finishing,
        unitPrice: dto.unitPrice,
      },
    });

    let item;
    if (existing) {
      item = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      item = await this.prisma.cartItem.create({
        data: {
          userId,
          productId: dto.productId,
          productSlug: dto.productSlug,
          name: dto.name,
          image: dto.image ?? 'default',
          imageUrl: dto.imageUrl,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          size,
          material,
          finishing,
          options: (dto.options as Prisma.InputJsonValue) ?? undefined,
        },
      });
    }

    const cart = await this.getCart(userId);
    return {
      success: true,
      message: 'Added to cart',
      data: { item, ...cart.data },
    };
  }

  async updateItem(userId: string, id: string, dto: UpdateCartItemDto) {
    const existing = await this.prisma.cartItem.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.update({
      where: { id },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, id: string) {
    const existing = await this.prisma.cartItem.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id } });
    return this.getCart(userId);
  }

  async clear(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return {
      success: true,
      message: 'Cart cleared',
      data: { items: [], itemCount: 0, subtotal: 0 },
    };
  }
}
