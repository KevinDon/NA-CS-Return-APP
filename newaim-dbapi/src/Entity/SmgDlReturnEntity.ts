import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity ()
export class dl_return_remark {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    f_returnid : number;
    @Column()
    f_seq_no : number;
    @Column()
    f_remark: string;
    @CreateDateColumn()
    f_create_date:  string;
    @Column()
    f_create_userid :number
}