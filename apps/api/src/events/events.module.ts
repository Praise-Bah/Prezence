import { Module } from '@nestjs/common';
import { RedisModule } from '../redis';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [RedisModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
