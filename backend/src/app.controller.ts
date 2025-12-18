import { Controller, Get, Res, Req, Next } from '@nestjs/common';
import { Response, Request, NextFunction } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  // 处理所有非 API 路径，返回前端 index.html（用于 SPA 路由）
  @Get('*')
  serveFrontend(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    // 排除 API 路径和静态资源，交给其他路由处理
    if (req.url.startsWith('/api/') || req.url.startsWith('/assets/')) {
      return next();
    }
    
    // 返回前端 index.html
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }
}
