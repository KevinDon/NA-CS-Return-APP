import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity ()
export class dl_return_remark {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "int",
        width: 11,
        comment: 'return表的主键ID'
    })
    f_returnid : number;

    @Column({
        type:'varchar',
        length:50,
        comment: '客服退货处理流水号，1:通过APP扫描生成的流水号以A打头，手动创建的记录流水号以M打头'
    })
    f_seq_no : string;

    @Column({
        nullable: true,
        comment: '备注',
        type: "text",
    })
    f_remark: string;

    @Column({
        type:'timestamp',
        comment: '创建日期'
    })
    f_create_date:  string;

    @Column({
        type: "int",
        width: 11,
        comment:'创建人'
    })
    f_create_userid :number
}
