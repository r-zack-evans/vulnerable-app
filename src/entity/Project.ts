import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string; // VULNERABILITY: Susceptible to stored XSS

  @Column({ nullable: true, type: 'date' })
  startDate: Date;

  @Column({ nullable: true, type: 'date' })
  endDate: Date;

  @Column({ default: 'Not Started' })
  status: string; // 'Not Started', 'In Progress', 'Complete', 'On Hold'

  @Column({ nullable: true })
  managerId: number; // User ID of project manager

  @Column({ nullable: true })
  clientId: number; // User ID of client contact

  @Column({ nullable: true })
  budget: number; // VULNERABILITY: No validation on budget value

  @Column({ default: 0 })
  completionPercentage: number;

  @Column('simple-array', { nullable: true })
  teamMembers: number[]; // Array of User IDs

  @Column({ default: false })
  isArchived: boolean;

  @Column('simple-json', { nullable: true })
  metadata: { clientNotes: string; internalNotes: string; }; // VULNERABILITY: No sanitization
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}