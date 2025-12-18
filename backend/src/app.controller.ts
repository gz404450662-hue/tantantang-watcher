import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  // 处理所有非 API 路径，返回前端 index.html（用于 SPA 路由）
  @Get('*')
  serveFrontend(@Res() res: Response) {
    // 排除 API 路径
    if (res.req.url.startsWith('/api')) {
      return res.status(404).send('Not Found');
    }
    
    // 返回前端 index.html
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }
}
