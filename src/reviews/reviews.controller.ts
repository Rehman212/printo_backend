import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../auth/types/jwt-payload';

@Controller('products')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':slug/reviews')
  list(@Param('slug') slug: string) {
    return this.reviewsService.listBySlug(slug);
  }

  @Post(':slug/reviews')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(
      slug,
      { userId: user.userId, email: user.email },
      dto,
    );
  }
}
