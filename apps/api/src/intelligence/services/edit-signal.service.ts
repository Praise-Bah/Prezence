import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { UserEditSignal } from '../entities/user-edit-signal.entity';

@Injectable()
export class EditSignalService {
  constructor(
    @InjectRepository(UserEditSignal)
    private readonly repo: Repository<UserEditSignal>,
  ) {}

  async capture(
    userId: string,
    platform: string,
    fieldName: string,
    originalText: string,
    editedText: string,
  ): Promise<void> {
    if (originalText === editedText) return;
    await this.repo.save(
      this.repo.create({
        userId,
        platform,
        fieldName,
        originalText,
        editedText,
      }),
    );
  }

  async getRecentSignals(since: Date): Promise<UserEditSignal[]> {
    return this.repo.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: 'ASC' },
    });
  }
}
