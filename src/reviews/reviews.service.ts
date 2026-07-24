import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async refreshProductStats(productId: string) {
    const agg = await this.prisma.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const count = agg._count._all;
    const avg = agg._avg.rating ?? 0;
    const rating = count > 0 ? Math.round(avg * 10) / 10 : 0;

    return this.prisma.product.update({
      where: { id: productId },
      data: { rating, reviews: count },
      select: { id: true, slug: true, rating: true, reviews: true },
    });
  }

  async listBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true, slug: true, rating: true, reviews: true, name: true },
    });
    if (!product || !product) throw new NotFoundException('Product not found');

    const items = await this.prisma.productReview.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      success: true,
      data: {
        product: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          rating: product.rating,
          reviews: product.reviews,
        },
        items: items.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          authorName: r.authorName,
          createdAt: r.createdAt,
          userId: r.userId,
        })),
      },
    };
  }

  async create(
    slug: string,
    user: { userId: string; email: string },
    dto: CreateReviewDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true, active: true },
    });
    if (!product || !product.active) {
      throw new NotFoundException('Product not found');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true },
    });

    const authorName =
      dto.authorName?.trim() || dbUser?.name?.trim() || user.email.split('@')[0];

    if (!authorName) {
      throw new BadRequestException('Author name is required');
    }

    try {
      const review = await this.prisma.productReview.create({
        data: {
          productId: product.id,
          userId: user.userId,
          rating: dto.rating,
          title: dto.title?.trim() || null,
          body: dto.body.trim(),
          authorName,
        },
      });

      const productStats = await this.refreshProductStats(product.id);

      return {
        success: true,
        message: 'Review submitted',
        data: {
          review: {
            id: review.id,
            rating: review.rating,
            title: review.title,
            body: review.body,
            authorName: review.authorName,
            createdAt: review.createdAt,
            userId: review.userId,
          },
          product: productStats,
        },
      };
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e
          ? String((e as { code: string }).code)
          : '';
      if (code === 'P2002') {
        throw new ConflictException(
          'You already reviewed this product. One review per account.',
        );
      }
      throw e;
    }
  }
}
