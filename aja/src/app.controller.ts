import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { Cron } from '@nestjs/schedule';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }
  private readonly logger = new Logger(AppService.name);

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Cron('*/15 * * * *')
  handleCron() {
    const result = this.getHello();
    this.logger.log(`Cronjob ejecutado: ${result}`);
  }
}
