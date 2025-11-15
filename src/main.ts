import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthInterceptor } from './features';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new AuthInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
