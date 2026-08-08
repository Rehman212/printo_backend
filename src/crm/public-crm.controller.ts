import { Controller, Get, Param } from '@nestjs/common';
import { CrmService } from './crm.service';

/** Public storefront CMS reads (published content only). */
@Controller('crm')
export class PublicCrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('posts')
  listPublishedPosts() {
    return this.crmService.listPublishedPosts();
  }

  @Get('posts/:slug')
  getPublishedPost(@Param('slug') slug: string) {
    return this.crmService.getPublishedPostBySlug(slug);
  }

  @Get('pages/:slug')
  getPublishedPage(@Param('slug') slug: string) {
    return this.crmService.getPublishedPageBySlug(slug);
  }
}
