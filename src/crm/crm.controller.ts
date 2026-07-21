import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateMenuDto,
  CreatePageDto,
  CreatePostDto,
  UpdateMenuDto,
  UpdatePageDto,
  UpdatePostDto,
} from './dto/crm.dto';

@Controller('admin/crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // Menus
  @Get('menus')
  listMenus() {
    return this.crmService.listMenus();
  }

  @Post('menus')
  createMenu(@Body() dto: CreateMenuDto) {
    return this.crmService.createMenu(dto);
  }

  @Patch('menus/:id')
  updateMenu(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.crmService.updateMenu(id, dto);
  }

  @Delete('menus/:id')
  removeMenu(@Param('id') id: string) {
    return this.crmService.removeMenu(id);
  }

  // Posts
  @Get('posts')
  listPosts() {
    return this.crmService.listPosts();
  }

  @Post('posts')
  createPost(@Body() dto: CreatePostDto) {
    return this.crmService.createPost(dto);
  }

  @Patch('posts/:id')
  updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.crmService.updatePost(id, dto);
  }

  @Delete('posts/:id')
  removePost(@Param('id') id: string) {
    return this.crmService.removePost(id);
  }

  // Pages
  @Get('pages')
  listPages() {
    return this.crmService.listPages();
  }

  @Post('pages')
  createPage(@Body() dto: CreatePageDto) {
    return this.crmService.createPage(dto);
  }

  @Patch('pages/:id')
  updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.crmService.updatePage(id, dto);
  }

  @Delete('pages/:id')
  removePage(@Param('id') id: string) {
    return this.crmService.removePage(id);
  }
}
