import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import LocalFile from '../../files/entities/localfile.entity';
import User from './user.entity';

@Entity()
class Supervisor {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @JoinColumn()
    @OneToOne(() => User, { nullable: true, eager: true })
    public user?: User;

    @OneToOne(() => User, { nullable: true })
    public selfieFile?: LocalFile;
}

export default Supervisor