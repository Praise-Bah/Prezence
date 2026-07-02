import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index('user_edit_signals_user_id_idx', ['userId'])
@Index('user_edit_signals_created_at_idx', ['createdAt'])
@Entity({ schema: 'public', name: 'user_edit_signals' })
export class UserEditSignal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  platform!: string;

  @Column({ name: 'field_name', type: 'text' })
  fieldName!: string;

  @Column({ name: 'original_text', type: 'text' })
  originalText!: string;

  @Column({ name: 'edited_text', type: 'text' })
  editedText!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
