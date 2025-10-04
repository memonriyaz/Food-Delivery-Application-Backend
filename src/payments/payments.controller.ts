import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    const rawBody = (req.body as Buffer).toString('utf8');
    await this.paymentsService.handleCashfreeWebhook(rawBody, signature);
    return { received: true };
  }
}
