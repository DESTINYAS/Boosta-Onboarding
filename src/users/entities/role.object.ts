import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import LocalFile from '../../files/entities/localfile.entity';
import User from './user.entity';

@Entity()
class RoleObject {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    // setting up bi-direction between the two entities
    // fetch addresses with users
    // .find({ relations: ['user]})
    // When setting up bi-directional entities do not use JoinTable here since it has been used in User table
    @OneToOne(() => User, (user: User) => user.profile)
    public user?: User;

}

export default RoleObject