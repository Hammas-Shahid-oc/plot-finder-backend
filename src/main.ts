import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Compress responses (gzip) for large payloads
  app.use(compression({ level: 8 }));

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Plot Finder API')
    .setDescription(
      `Plot Finder Backend API with Authentication

This API provides authentication endpoints using JWT tokens and user management functionality.

**Authentication Flow:**
1. Login with email/password to get access and refresh tokens
2. Use the access token in the Authorization header for protected routes
3. Refresh the access token when it expires using the refresh token endpoint
`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('health', 'Health check endpoints')
    .addTag('parcels', 'Good parcels (spatial search)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Filter out NestAuth routes from Swagger documentation
  if (document.paths) {
    Object.keys(document.paths).forEach((path) => {
      if (path.startsWith('/nestauth')) {
        delete document.paths[path];
      }
    });
  }

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
