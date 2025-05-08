import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';
import { Product } from './Product';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  productId: number;

  @Column('text')
  content: string; // VULNERABILITY: Vulnerable to stored XSS

  @Column('int')
  rating: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // TypeORM relationships
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Product)
  product: Product;
}