import { Controller, Get, Query, Param } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('list')
  async getList(
    @Query('page') page?: string,
    @Query('count') count?: string,
    @Query('city') city?: string,
    @Query('lon') lon?: string,
    @Query('lat') lat?: string,
  ) {
    return this.activityService.getActivityList({
      page,
      count,
      city,
      lon,
      lat,
    });
  }

  @Get('search')
  async search(
    @Query('keyword') keyword: string = '',
    @Query('page') page?: string,
    @Query('count') count?: string,
    @Query('city') city?: string,
    @Query('lon') lon?: string,
    @Query('lat') lat?: string,
  ) {
    return this.activityService.queryActivity({
      searchKey: keyword,
      page,
      count,
      city,
      lon,
      lat,
    });
  }

  @Get('detail/:id')
  async getDetail(
    @Param('id') id: string,
    @Query('lon') lon?: string,
    @Query('lat') lat?: string,
  ) {
    return this.activityService.getActivityDetail(id, { lon, lat });
  }
}
