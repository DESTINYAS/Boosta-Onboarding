import { Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm'

import LocalFile from '../../../files/entities/localfile.entity';
import Merchant from './merchant.entity';

@Entity()
export default class ShopPhoto {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @JoinColumn()
    @OneToOne((type => LocalFile), { eager: true, cascade: false })
    public localFile: LocalFile

    @ManyToOne(() => Merchant, (merchant: Merchant) => merchant.shopPhotos, { eager: false, cascade: false })
    @JoinTable()
    public merchant: Merchant;

}