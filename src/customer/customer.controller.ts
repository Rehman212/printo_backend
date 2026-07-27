import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../auth/types/jwt-payload';
import { CustomerService } from './customer.service';
import {
  CreateCustomerQuoteDto,
  CreateSavedDesignDto,
  CreateTicketDto,
  CreateWishlistDto,
} from './dto/customer.dto';

@Controller('customer')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('overview')
  overview(@CurrentUser() user: JwtPayloadUser) {
    return this.customerService.overview(user.userId);
  }

  @Get('quotes')
  quotes(@CurrentUser() user: JwtPayloadUser) {
    return this.customerService.listQuotes(user.userId);
  }

  @Post('quotes')
  createQuote(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateCustomerQuoteDto,
  ) {
    return this.customerService.createQuote(user.userId, dto);
  }

  @Get('downloads')
  downloads(@CurrentUser() user: JwtPayloadUser) {
    return this.customerService.listDownloads(user.userId);
  }

  @Get('invoices')
  invoices(@CurrentUser() user: JwtPayloadUser) {
    return this.customerService.listInvoices(user.userId);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: JwtPayloadUser) {
    return this.customerService.listNotifications(user.userId);
  }

  @Get('wishlist')
  wishlist(@CurrentUser() user: JwtPayloadUser) {
    return this.customerService.listWishlist(user.userId);
  }

  @Post('wishlist')
  addWishlist(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateWishlistDto,
  ) {
    return this.customerService.addWishlist(user.userId, dto);
  }

  @Delete('wishlist/:id')
  removeWishlist(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    return this.customerService.removeWishlist(user.userId, id);
  }

  @Get('tickets')
  tickets(@CurrentUser() user: JwtPayloadUser) {
    return this.customerService.listTickets(user.userId);
  }

  @Post('tickets')
  createTicket(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateTicketDto,
  ) {
    return this.customerService.createTicket(user.userId, dto);
  }

  @Get('designs')
  designs(@CurrentUser() user: JwtPayloadUser) {
    return this.customerService.listDesigns(user.userId);
  }

  @Post('designs')
  createDesign(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateSavedDesignDto,
  ) {
    return this.customerService.createDesign(user.userId, dto);
  }

  @Delete('designs/:id')
  deleteDesign(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    return this.customerService.deleteDesign(user.userId, id);
  }
}
