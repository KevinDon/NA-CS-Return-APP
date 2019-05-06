import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity ()
export class dl_return {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type:'varchar',
        length:50,
        comment: '客服退货处理流水号，1:通过APP扫描生成的流水号以A打头，手动创建的记录流水号以M打头'
    })
    f_seq_no : string;

    @Column({
        nullable: true,
        comment: '退货产品SKU',
        length: 150,
        type: "varchar",
    })
    f_sku: string;

    @Column({
        nullable: true,
        type:'timestamp',
        comment: '创建日期'
    })
    f_create_date:  string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 50,
        comment:'产品条码，例如NA015671'
    })
    f_barcode :string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 50,
        comment:'产品批次号，例如J18-0479'
    })
    f_job_no :string;

    @Column({
        nullable: true,
        type: "decimal",
        width: 12,
        comment:'产品成本，例如44.61'
    })
    f_unit_cost :string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 100,
        comment:'Customer order number'
    })
    f_customer_order_no :string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 100,
        comment:'OMS Order'
    })
    f_order_no :string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 255,
        comment:'发货时的快递运单号'
    })
    f_delivery_tracking_no :string;

    @Column({
        nullable: true,
        type: "int",
        width: 11,
        comment:'发货时的快递公司编号'
    })
    f_delivery_courier_id :number;

    @Column({
        nullable: true,
        type: "varchar",
        length: 30,
        comment:'发货时的快递公司名称'
    })
    f_delivery_courier_name : string;

    @Column({
        nullable: true,
        type: "decimal",
        width: 12,
        comment:'发货运费'
    })
    f_post_est : string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 100,
        comment:'客户名称'
    })
    f_user_nick : string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 250,
        comment:'客户住址'
    })
    f_address : string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 30,
        comment:'客户电话'
    })
    f_phone : string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 200,
        comment:'退货原因'
    })
    f_return_reason : string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 255,
        comment:'退货时的快递运单号'
    })
    f_return_tracking_no : string;

    @Column({
        nullable: true,
        type: "int",
        width: 11,
        comment:'退货时的快递公司编号'
    })
    f_return_courier_id : number;

    @Column({
        nullable: true,
        type: "varchar",
        width: 30,
        comment:'退货时的快递公司名称'
    })
    f_return_courier_name : string;


    @Column({
        nullable: true,
        type: "varchar",
        width: 100,
        comment:'相关的sales message系统ticket编号'
    })
    f_ticket_no : string;

    @Column({
        nullable: true,
        type: "text",
        comment:'备注'
    })
    f_note : string;

    @Column({
        nullable: true,
        type: "text",
        comment:'Title'
    })
    f_title : string;

    @Column({
        nullable: true,
        type: "varchar",
        length:30,
        comment:'处理方式,1.重新入库,2.二手处理,3.作废,4.拆成部件'
    })
    f_process : string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 100,
        comment:'process是ASN时的对应编号'
    })
    f_process_asn : string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 100,
        comment:'process是Second Hand时的对应编号'
    })
    f_process_secondhand : string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 50,
        comment:'处理结果'
    })
    f_result : string;

    @Column({
        nullable: true,
        type: "timestamp",
        comment:'最后修改日期'
    })
    f_lastupdate_date : string;

    @Column({
        nullable: true,
        type: "int",
        width: 11,
        comment:'创建人'
    })
    f_create_userid : number;

    @Column({
        nullable: true,
        type: "varchar",
        length: 100,
        comment:'创建人名称'
    })
    f_create_username : string;

    @Column({
        nullable: true,
        type: "int",
        width: 11,
        comment:'最后修改人'
    })
    f_lastupdate_userid : number;

    @Column({
        nullable: true,
        type: "varchar",
        length: 100,
        comment:'最后修改人名称'
    })
    f_lastupdate_username : string;

    @Column({
        nullable: true,
        type: "varchar",
        length: 100,
        comment:'接收人'
    })
    f_receiver : string;

}
