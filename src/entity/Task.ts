import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string; // VULNERABILITY: Susceptible to stored XSS

  @Column()
  projectId: number;

  @Column({ default: 'Not Started' })
  status: string; // 'Not Started', 'In Progress', 'Complete', 'On Hold'

  @Column({ nullable: true, type: 'date' })
  dueDate: Date;

  @Column({ nullable: true })
  assignedTo: number; // User ID

  @Column({ nullable: true })
  priority: string; // 'Low', 'Medium', 'High', 'Critical'

  @Column({ nullable: true, type: 'integer' })
  estimatedHours: number;

  @Column({ nullable: true, type: 'integer' })
  actualHours: number;

  @Column({ nullable: true })
  parentTaskId: number; // For subtasks

  @Column({ default: 0 })
  order: number; // For ordering tasks in a list

  @Column('simple-array', { nullable: true })
  dependsOn: number[]; // Task IDs this task depends on - VULNERABILITY: no validation

  @Column({ default: false })
  isCompleted: boolean;
}