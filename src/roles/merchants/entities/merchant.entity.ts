import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Area from '../../../areas/entities/area.entity';
import LocalFile from '../../../files/entities/localfile.entity';
import User from '../../../users/entities/user.entity';
import ShopPhoto from './shop.entity';

@Entity()
class Merchant {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ default: '' })
  public shopStreet: string;

  @Column({ default: '' })
  public shopNumber: string;

  @ManyToOne(() => Area, { nullable: true, eager: true })
  @JoinColumn()
  public area?: Area;

  @JoinColumn()
  @OneToOne(() => User, { nullable: true, eager: true })
  public user?: User;

  @JoinColumn()
  @OneToOne(() => LocalFile, { nullable: true, eager: true })
  public selfieFile?: LocalFile;

  @Column({ default: 0 })
  public shopValue: number;

  @Column({ default: false })
  public shopeValueApproved: boolean;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  public dateShopValueSet: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  public dateShopValueApproved: Date;

  @ManyToOne((type) => User, { nullable: true })
  public shopValueSetBy: User;

  @ManyToOne((type) => User, { nullable: true, eager: true })
  public onboardedBy: User;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
    nullable: true
  })
  public dateOnboarded: Date;

  @OneToMany(() => ShopPhoto, (photo: ShopPhoto) => photo.merchant, {
    eager: true,
    cascade: false,
  })
  public shopPhotos?: ShopPhoto[];

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  public updatedAt: Date;
}

export default Merchant;
