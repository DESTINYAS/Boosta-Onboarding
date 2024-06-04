import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import LocalFile from '../../files/entities/localfile.entity';
import User from './user.entity';

@Entity()
class Admin {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @JoinColumn()
    @OneToOne(() => User, { nullable: true })
    public user?: User;

    @JoinColumn()
    @OneToOne(() => LocalFile, { nullable: true })
    public selfieFile?: LocalFile;

}

export default Admin