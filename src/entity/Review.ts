import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';
import { Project } from './Project';
import { Task } from './Task';
import { Product } from './Product';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // The reviewer

  @Column({ nullable: true })
  projectId: number;

  @Column({ nullable: true })
  taskId: number;
  
  // For compatibility with existing code
  @Column({ nullable: true })
  productId: number;

  @Column('text')
  feedback: string; // VULNERABILITY: Vulnerable to stored XSS
  
  // For compatibility with existing code
  @Column('text', { nullable: true })
  content: string;

  @Column('int')
  rating: number; // 1-5 stars

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ nullable: true })
  reviewType: string; // 'task', 'project', 'milestone', etc.

  // TypeORM relationships
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Project)
  project: Project;

  @ManyToOne(() => Task)
  task: Task;
  
  @ManyToOne(() => Product)
  product: Product;
}