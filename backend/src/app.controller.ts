import { Controller, Get, Res, Req, Next } from '@nestjs/common';
import { Response, Request, NextFunction } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  // 处理 /tantantang 路径，返回前端 index.html
  @Get('tantantang*')
  serveFrontend(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    // 排除 API 路径和静态资源，交给其他路由处理
    if (req.url.startsWith('/tantantang/api/') || req.url.startsWith('/tantantang/assets/')) {
      return next();
    }
    
    // 返回前端 index.html
    res.sendFile(join(__dirname, '..', 'public', 'tantantang', 'index.html'));
  }
}
