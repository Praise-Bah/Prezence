import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // Schema is managed via supabase/migrations SQL files, never TypeORM sync.
        synchronize: false,
        ssl: { rejectUnauthorized: false },
      }),
    }),
  ],
})
export class DatabaseModule {}
