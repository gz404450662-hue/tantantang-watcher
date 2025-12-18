import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 启用 CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 配置静态资源服务 - 提供前端打包文件
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/', // 静态文件路径前缀
  });

  // 设置全局 API 前缀（可选，如果不想所有路由都加 /api）
  // app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);
  console.log(`应用运行在: http://${host}:${port}`);
  console.log(`API 地址: http://${host}:${port}/api`);
  console.log(`静态文件目录: ${join(__dirname, '..', 'public')}`);
}
bootstrap();
