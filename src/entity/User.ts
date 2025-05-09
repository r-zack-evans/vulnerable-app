import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ nullable: true })
  password: string; // Now nullable for security - we've migrated to passwordHash

  @Column({ nullable: true })
  passwordHash: string;

  @Column()
  email: string;

  @Column({ default: 'user' })
  role: string; // 'user' or 'admin' or 'manager' or 'client'

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true })
  resetTokenExpiry: Date;

  @Column({ nullable: true })
  apiKey: string; // VULNERABILITY: Sensitive data stored in plaintext
  
  // For compatibility with existing code
  @Column({ nullable: true })
  creditCardNumber: string; // VULNERABILITY: Sensitive data stored in plaintext

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'simple-json', nullable: true })
  preferences: { theme: string; notifications: boolean; dashboardLayout: string };
}