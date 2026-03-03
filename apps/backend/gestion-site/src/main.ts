import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  app.enableCors();
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // Set global prefix
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Gestion Site API is running on: http://localhost:${port}/api`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST   /api/gestion-sites           - Create a new site`);
  console.log(`   GET    /api/gestion-sites           - Get all sites (paginated)`);
  console.log(`   GET    /api/gestion-sites/statistics - Get site statistics`);
  console.log(`   GET    /api/gestion-sites/budget/total - Get total budget`);
  console.log(`   GET    /api/gestion-sites/active    - Get active sites`);
  console.log(`   GET    /api/gestion-sites/:id       - Get site by ID`);
  console.log(`   GET    /api/gestion-sites/search/nom/:nom - Search by name`);
  console.log(`   GET    /api/gestion-sites/localisation/:localisation - Find by location`);
  console.log(`   PUT    /api/gestion-sites/:id       - Update a site`);
  console.log(`   DELETE /api/gestion-sites/:id/soft  - Soft delete a site`);
  console.log(`   POST   /api/gestion-sites/:id/restore - Restore a soft-deleted site`);
  console.log(`   DELETE /api/gestion-sites/:id       - Hard delete a site`);
}
bootstrap();
