import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ironSession } from 'iron-session/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const session = ironSession({
    cookieName: 'iron-session/examples/express',
    password: process.env.SECRET_COOKIE_PASSWORD,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  });
  app.use(session);

  await app.listen(3000);
}
bootstrap();
