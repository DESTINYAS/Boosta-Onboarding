import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Area from '../../../areas/entities/area.entity';
import LocalFile from '../../../files/entities/localfile.entity';
import User from '../../../users/entities/user.entity';

@Entity()
class Agent {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @JoinColumn()
  @OneToOne(() => User, { nullable: true, eager: true })
  public user?: User;

  @JoinColumn()
  @OneToOne(() => LocalFile, { nullable: true, eager: true })
  public selfieFile?: LocalFile;

  @ManyToOne(() => Area, { nullable: true, eager: true })
  @JoinColumn()
  public area?: Area;

  @ManyToOne((type) => User, { nullable: true, eager: true })
  public onboardedBy: User;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
    nullable: true
  })
  public dateOnboarded: Date;
}

export default Agent;
