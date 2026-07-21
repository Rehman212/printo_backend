import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMenuDto,
  CreatePageDto,
  CreatePostDto,
  UpdateMenuDto,
  UpdatePageDto,
  UpdatePostDto,
} from './dto/crm.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Menus ──────────────────────────────────────────────
  async listMenus() {
    const data = await this.prisma.menu.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return { success: true, data };
  }

  async createMenu(dto: CreateMenuDto) {
    const data = await this.prisma.menu.create({
      data: {
        name: dto.name,
        location: dto.location ?? 'header',
        active: dto.active ?? true,
        items: dto.items?.length
          ? {
              create: dto.items.map((item, i) => ({
                label: item.label,
                href: item.href,
                sortOrder: item.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    return { success: true, message: 'Menu created', data };
  }

  async updateMenu(id: string, dto: UpdateMenuDto) {
    const existing = await this.prisma.menu.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Menu not found');

    const data = await this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await tx.menuItem.deleteMany({ where: { menuId: id } });
      }
      return tx.menu.update({
        where: { id },
        data: {
          name: dto.name,
          location: dto.location,
          active: dto.active,
          ...(dto.items
            ? {
                items: {
                  create: dto.items.map((item, i) => ({
                    label: item.label,
                    href: item.href,
                    sortOrder: item.sortOrder ?? i,
                  })),
                },
              }
            : {}),
        },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return { success: true, message: 'Menu updated', data };
  }

  async removeMenu(id: string) {
    const existing = await this.prisma.menu.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Menu not found');
    await this.prisma.menu.delete({ where: { id } });
    return { success: true, message: 'Menu deleted', data: { id } };
  }

  // ── Posts ──────────────────────────────────────────────
  async listPosts() {
    const data = await this.prisma.post.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return { success: true, data };
  }

  async createPost(dto: CreatePostDto) {
    await this.ensureUniqueSlug('post', dto.slug);
    const status = dto.status ?? ContentStatus.DRAFT;
    const data = await this.prisma.post.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImage: dto.coverImage,
        status,
        publishedAt: status === ContentStatus.PUBLISHED ? new Date() : null,
      },
    });
    return { success: true, message: 'Post created', data };
  }

  async updatePost(id: string, dto: UpdatePostDto) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (dto.slug && dto.slug !== existing.slug) {
      await this.ensureUniqueSlug('post', dto.slug);
    }

    const status = dto.status ?? existing.status;
    const data = await this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImage: dto.coverImage,
        status: dto.status,
        publishedAt:
          status === ContentStatus.PUBLISHED
            ? existing.publishedAt ?? new Date()
            : existing.publishedAt,
      },
    });
    return { success: true, message: 'Post updated', data };
  }

  async removePost(id: string) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    await this.prisma.post.delete({ where: { id } });
    return { success: true, message: 'Post deleted', data: { id } };
  }

  // ── Pages ──────────────────────────────────────────────
  async listPages() {
    const data = await this.prisma.page.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return { success: true, data };
  }

  async createPage(dto: CreatePageDto) {
    await this.ensureUniqueSlug('page', dto.slug);
    const data = await this.prisma.page.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        status: dto.status ?? ContentStatus.DRAFT,
      },
    });
    return { success: true, message: 'Page created', data };
  }

  async updatePage(id: string, dto: UpdatePageDto) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Page not found');
    if (dto.slug && dto.slug !== existing.slug) {
      await this.ensureUniqueSlug('page', dto.slug);
    }

    const data = await this.prisma.page.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        status: dto.status,
      },
    });
    return { success: true, message: 'Page updated', data };
  }

  async removePage(id: string) {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Page not found');
    await this.prisma.page.delete({ where: { id } });
    return { success: true, message: 'Page deleted', data: { id } };
  }

  private async ensureUniqueSlug(kind: 'post' | 'page', slug: string) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException(
        'Slug must be lowercase kebab-case (e.g. about-us)',
      );
    }
    const found =
      kind === 'post'
        ? await this.prisma.post.findUnique({ where: { slug } })
        : await this.prisma.page.findUnique({ where: { slug } });
    if (found) {
      throw new ConflictException(`${kind} slug "${slug}" already exists`);
    }
  }
}
