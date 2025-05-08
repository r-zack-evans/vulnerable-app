import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string; // VULNERABILITY: Susceptible to stored XSS

  @Column('float')
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ default: false })
  isPublished: boolean;

  @Column('simple-array', { nullable: true })
  tags: string[];
}