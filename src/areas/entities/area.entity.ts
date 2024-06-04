import {IsNumber, MaxLength } from 'class-validator';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
class Area {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  @MaxLength(50)
  public state: string;

  @Column()
  @MaxLength(50)
  public title: string;

  @Column({ default: 0 })
  @IsNumber()
  public deliveryCost: number;
}

export default Area;
