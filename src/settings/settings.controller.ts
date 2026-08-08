import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSiteSettingsDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async get() {
    const data = await this.settingsService.getAdmin();
    return { success: true, data };
  }

  @Put()
  update(@Body() dto: UpdateSiteSettingsDto) {
    return this.settingsService.update(dto);
  }
}

@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getPublic() {
    const data = await this.settingsService.getPublic();
    return { success: true, data };
  }
}
