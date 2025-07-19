import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('passwords')
export class Password {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  password: string;

  @OneToOne(() => User, (user) => user.password, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
