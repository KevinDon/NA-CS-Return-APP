import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity ()
export class dl_return_attachment {

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
        comment: '附件类型',
        type: "text",
    })
    f_type: string;

    @Column({
        type:'varchar',
        comment: '附件名称',
        length :50
    })
    f_file_name:  string;

    @Column({
        type: "int",
        comment:'附件大小'
    })
    f_file_size :number;


    @Column({
        type: "timestamp",
        comment:'上传日期'
    })
    f_create_date :number;


    @Column({
        type: "varchar",
        comment:'附件地址',
        length: 500
    })
    f_file_url :string;
}
