import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

@Entity('project')
export class Project implements VirtualProperties {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string; // VULNERABILITY: Susceptible to stored XSS

  @Column({ nullable: true })
  startDate: string;

  @Column({ nullable: true })
  endDate: string;

  @Column({ default: 'Not Started' })
  status: string; // 'Not Started', 'In Progress', 'Complete', 'On Hold'

  @Column({ default: 0 })
  completionPercentage: number;
  
  @Column({ nullable: true })
  ownerId: number; // User ID of project owner
  
  @Column({ nullable: true })
  managerId: number; // User ID of project manager

  @Column({ nullable: true })
  clientId: number; // User ID of client contact
  
  // Virtual properties that will be populated by the API
  ownerName?: string;
  ownerRole?: string;
  ownerDepartment?: string;
  teamMembersDetails?: TeamMemberInfo[];
  teamMembersCount?: number;
  additionalMembersCount?: number;
}