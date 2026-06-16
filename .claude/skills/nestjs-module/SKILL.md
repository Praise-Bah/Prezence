---
name: nestjs-module
description: Use when scaffolding a new NestJS module in Prezence —
creates the complete file structure with module, controller, service,
DTOs, entity, index.ts, and spec file following Prezence conventions.
---

# NestJS Module Scaffolding

When creating a new module, always generate ALL of these files:

1. module-name.module.ts — with imports, controllers, providers arrays
2. module-name.controller.ts — with proper decorators, guards, DTOs
3. module-name.service.ts — business logic only, no direct gateway calls
4. dto/create-xxx.dto.ts — with class-validator decorators
5. dto/update-xxx.dto.ts — extends PartialType(CreateXxxDto)
6. entities/xxx.entity.ts — TypeORM entity with proper column types
7. module-name.service.spec.ts — Jest unit tests with mocked dependencies
8. index.ts — exports only the service and any DTOs needed by other modules

Always decorate controllers with:
- @Controller('route')
- @UseGuards(JwtAuthGuard) on protected routes
- @ApiTags('tag') for Swagger
- @ApiBearerAuth() on protected controllers

Always add the new module to app.module.ts imports array.
Always export the service from index.ts so other modules can import cleanly.
