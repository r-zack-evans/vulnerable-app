import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Type for team member object
type TeamMemberInfo = {
  id: number;
  username: string;
  department?: string;
  jobTitle?: string;
};

// Virtual properties for API responses
type VirtualProperties = {
  ownerName?: string;
  ownerRole?: string;
  ownerDepartment?: string;
  teamMembersDetails?: TeamMemberInfo[];
  teamMembersCount?: number;
  additionalMembersCount?: number;
};

@Entity()
export class Project implements VirtualProperties {
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
  ownerId: number; // User ID of project owner

  @Column({ nullable: true })
  clientId: number; // User ID of client contact

  @Column({ nullable: true })
  budget: number; // VULNERABILITY: No validation on budget value

  @Column({ default: 0 })
  completionPercentage: number;

  @Column('simple-array', { nullable: true })
  teamMembers: number[] | string; // Array of User IDs or comma-separated string

  @Column({ default: false })
  isArchived: boolean;

  @Column('simple-json', { nullable: true })
  metadata: { clientNotes: string; internalNotes: string; }; // VULNERABILITY: No sanitization
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  // Virtual properties that will be populated by the API
  ownerName?: string;
  ownerRole?: string;
  ownerDepartment?: string;
  teamMembersDetails?: TeamMemberInfo[];
  teamMembersCount?: number;
  additionalMembersCount?: number;
}