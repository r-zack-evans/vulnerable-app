import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './Project';

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string; // VULNERABILITY: Susceptible to stored XSS

  @Column()
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ default: 'Not Started' })
  status: string; // 'Not Started', 'In Progress', 'Complete', 'On Hold'

  @Column({ nullable: true })
  priority: string; // 'Low', 'Medium', 'High', 'Critical'
  
  @Column({ nullable: true })
  dueDate: string;

  @Column({ nullable: true, default: 0 })
  estimatedHours: number;

  @Column({ nullable: true, default: 0 })
  actualHours: number;

  @Column({ default: 0 })
  isCompleted: boolean;
}