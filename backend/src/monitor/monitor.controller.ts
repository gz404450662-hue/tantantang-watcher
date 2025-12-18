import { Controller, Get, Post, Delete, Body, Param, Query, Patch } from '@nestjs/common';
import { MonitorService, CreateMonitorTaskDto, MonitorTask, DailyRecord, UpdateTargetPriceDto } from './monitor.service';

@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Post('task')
  async createTask(@Body() dto: CreateMonitorTaskDto): Promise<MonitorTask> {
    return this.monitorService.createTask(dto);
  }

  @Get('tasks')
  async getAllTasks(): Promise<MonitorTask[]> {
    return this.monitorService.getAllTasks();
  }

  @Get('task/:id')
  async getTask(@Param('id') id: string): Promise<MonitorTask | undefined> {
    return this.monitorService.getTask(id);
  }

  @Delete('task/:id')
  async deleteTask(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.monitorService.deleteTask(id);
    return { success };
  }

  @Post('task/:id/stop')
  async stopTask(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.monitorService.stopTask(id);
    return { success };
  }

  @Patch('task/:id/price')
  async updateTargetPrice(
    @Param('id') id: string,
    @Body() dto: UpdateTargetPriceDto,
  ): Promise<{ success: boolean }> {
    const success = await this.monitorService.updateTargetPrice(id, dto.targetPrice);
    return { success };
  }

  @Post('cleanup')
  async cleanupTasks(): Promise<{ count: number }> {
    const count = await this.monitorService.cleanupTasks();
    return { count };
  }

  @Get('historical/:activityId')
  async getHistoricalData(
    @Param('activityId') activityId: string,
  ): Promise<DailyRecord[]> {
    return this.monitorService.getHistoricalData(parseInt(activityId));
  }
}
