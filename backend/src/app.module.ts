import { Module } from '@nestjs/common';
import { ActivityModule } from './activity/activity.module';
import { MonitorModule } from './monitor/monitor.module';
import { AppController } from './app.controller';

@Module({
  imports: [ActivityModule, MonitorModule],
  controllers: [AppController],
})
export class AppModule {}
