import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationJobEntity } from '../integration/entities/automation-job.entity';
import { CircuitBreakerService } from './circuit-breaker.service';

@Module({
  imports: [TypeOrmModule.forFeature([AutomationJobEntity])],
  providers: [CircuitBreakerService],
  exports: [TypeOrmModule, CircuitBreakerService],
})
export class SharedModule {}
