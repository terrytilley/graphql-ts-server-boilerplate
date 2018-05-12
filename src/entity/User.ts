import * as bcrypt from 'bcryptjs';
import {
  Entity,
  Column,
  BaseEntity,
  BeforeInsert,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column('varchar', { length: 255 })
  email: string;

  @Column('text') password: string;

  @Column('boolean', { default: false })
  confirmed: boolean;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
