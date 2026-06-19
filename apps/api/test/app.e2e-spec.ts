import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Controller, Get, Module } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

@Controller()
class HealthController {
  @Get()
  health() {
    return 'Hello World!';
  }
}

@Module({ controllers: [HealthController] })
class MinimalModule {}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MinimalModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
