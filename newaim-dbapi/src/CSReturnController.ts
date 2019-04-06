import {DbServiceObj} from "./DbService";
import AppUtil from "./AppUtil";
import * as mssql from 'mssql';
import * as json2xls from 'json2xls';
import * as fs from 'fs';
import * as stream from 'stream';
import * as mysql from 'mysql';


enum ActionType {
    Add,
    Update
}

export default class CSReturnController{
    async findTicketByOrderNo(orderNo: string){
        let ticketNo = '';
        let cmd = `select top 1 [Ticket No.] as ticket_no from [SM_Ticket_Report] where [OMS Order No]='${orderNo}'`;
        let connection = await DbServiceObj.getPowerBIDbConnection();
        let request = connection.request();
        let data = await request.query(cmd);
        if(!!data && !!data.recordset && data.recordset.length > 0){
            ticketNo = data.recordset[0].ticket_no;
        }
        return ticketNo;
    }

    async findDataByTracking1(tracking){
        let cmd = `select top 1 *,  user_nick as order_user_nick  from [Tracking] where [delivery_tracking_no] = '${tracking}' 
    order by [oe_modified] desc, order_no desc, barcode`;
        let SysConnection = await DbServiceObj.getSysDbConnection();
        let data1 = await SysConnection.request().query(cmd);
        if(data1.recordset.length <= 0) return null;

        let row = data1.recordset[0];
        let orderNo = row.order_no;
        let sku = row.sku;
        let $data = {
            "tracking_number": tracking,
            "timestamp" :new Date().getTime(),
        };
        $data = AppUtil.encipherSMG($data);
        AppUtil.requestPostJson(
            {
                url: 'http://dev.test.com/api/index/tracking',
                data: $data
            },
            function(json){
                if(!!json && json.data.length > 0){
                    tracking = json.data.tracking_number;
                }
        });


        //订单编号，SKU都符合
        // cmd = `select f_ticket_no, f_tracking_number as return_tracking_no
        //             from dl_ticket
        //             where [OMS Order No]='${orderNo}'
        //             and (f_sku = '' or f_sku = '${sku}')
        //             order by [Ticket No.] desc`;
        cmd = `SELECT ticket.f_ticket_no, ticket.f_tracking_number as return_tracking_no, ticket_sku.f_sku  FROM dl_ticket ticket LEFT JOIN dl_ticket_sku ticket_sku ON ticket.f_ticket_no = ticket_sku.f_ticketno   WHERE ticket.f_oms_order_id='${orderNo}' AND ticket_sku.f_sku = '${sku}'`;
        let data2 = await DbServiceObj.executeSmQuery(cmd);
        if(data2.length > 0) data2 = JSON.parse(JSON.stringify(data2[0]));
        if(!!data2){
            return data2;
        }
        return {};
    }

    async findDataByTracking2(tracking){
        let cmd = `select top 1 [OMS Order No] as order_no, [Ticket No.] as ticket_no, [Return Tracking Number] as return_tracking_no, 
            SKU as sku   
            from [PowerBI].[dbo].[SM_Ticket_Report] 
            where [Return Tracking Number] like '%${tracking}%'
            order by [Ticket No.] desc`;
        let connection = await DbServiceObj.getSysDbConnection();
        let data1 = await connection.request().query(cmd);
        if(data1.recordset.length <= 0) return null;

        let row = data1.recordset[0];
        let orderNo = row.order_no;
        let sku = row.sku;
        if(!!sku) {
            //订单编号，SKU都符合
            cmd = `select top 1 *, user_nick as order_user_nick  from [Tracking] where [order_no] = '${orderNo}'
                and sku = '${sku}'
                order by [oe_modified] desc, order_no desc, barcode`;

            let data2 = await connection.request().query(cmd);
            if (data2.recordset.length > 0) {
                row = {...row, ...data2.recordset[0]};
            }
        }
        return row;
    }

    async findDataByTracking(req, res) {
        let tracking = req.query.tracking;
        if (!tracking || typeof tracking !== 'string') return res.send('');
        tracking = tracking.replace('(', '').replace(')', '').trim();

        // let cmd = `select f_loginname,f_password from dl_cs_user where f_loginname='${account}'`;
        // let row = await DbServiceObj.executeSmQuery(cmd);
        let $data = {
            "tracking_number": tracking,
            "timestamp" :new Date().getTime(),
        };
        $data = AppUtil.encipherSMG($data);
        AppUtil.requestPostJson(
            {
                url: 'http://dev.test.com/api/index/tracking',
                data: $data
            },
            function(json){
                if(!!json && json.data.length > 0){
                    tracking = json.data.tracking_number;
                }
         });

        //re-submit of tracking
        // let cmd = `select *
        //     from cs_return where delivery_tracking_no='${tracking}' or return_tracking_no = '${tracking}'
        //     order by Id desc limit 1`;
        let cmd = `SELECT * FROM dl_ticket_return_tracking WHERE f_tracking_number='${tracking}'`;
        //let connection = await DbServiceObj.getSysDbConnection();
        let [data1, data2] = await Promise.all([
            this.findDataByTracking1(tracking),
            //this.findDataByTracking2(tracking),
            // DbServiceObj.executeSmQuery(cmd)
            await DbServiceObj.executeSmQuery(cmd)
        ]);

         let responseData = data1;
        if(!data1 && !!data2) responseData = data2;
        //if(!!data3 && data3.length > 0) responseData = data3[0];
        if(!responseData) responseData = {};

        res.send(AppUtil.responseJSON('1', [responseData], '查询成功', true));
    }

    async saveReturn(req, res){
        let requestData = req.body;
        let cmd = '';
        let actionType = null;
        /*
        let fields = ['barcode', 'delivery_tracking_no', 'customer_order_no', 'sku',
            'job_no', 'process_type', 'process_asn', 'process_secondhand', 'result',
            'post_est', 'unit_cost', 'ticket_no', 'return_reason', 'return_courier_name',
            'return_tracking_no', 'order_no', 'order_user_nick', 'note', 'user'
        ];  */
        let fields = ['f_barcode', 'f_delivery_tracking_no', 'f_customer_order_no', 'f_sku','f_seq_no','f_receiver',
            'f_job_no', 'f_process', 'f_process_asn', 'f_process_secondhand', 'f_result',
            'f_post_est', 'f_unit_cost', 'f_ticket_no', 'f_return_reason', 'f_return_courier_name',
            'f_return_tracking_no', 'f_order_no', 'f_receiver', 'f_note', 'f_create_userid', 'f_create_username'
        ];
        let columns = [];
        let placeholders = [];
        let values = [];

        for(let field of fields){
            if(requestData[field] == null || requestData[field] == undefined) continue;
            columns.push(field);
            placeholders.push('?');
            values.push(requestData[field]);
        }
        /* TODO
        if(!!requestData.seq_no){
            let updateColumns = [];
            let values = [];
            for(let field of fields){
                if(requestData[field] == null || requestData[field] == undefined) continue;
                updateColumns.push(`${field}=?`);
                values.push(requestData[field]);
            }

            values.push(requestData.f_seq_no);
            cmd = mysql.format(`update cs_return set ${updateColumns.join()} where seq_no=?;
            SELECT concat('A', AUTO_INCREMENT) as next_id
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = "csreturn"
                    AND TABLE_NAME = "cs_return_scan_sequence"
            `, values);
            seqNo = requestData.seq_no;
            actionType = ActionType.Update;
            let data = await DbServiceObj.executeSmQuery(cmd);
            if(!!data[1] && data[1].length > 0 && !!data[1][0]['next_id']) {
                nextSeqNo = data[1][0]['next_id'];
            }
        } else {
            let columns = [];
            let placeholders = [];
            let values = [];
            for(let field of fields){
                if(requestData[field] == null || requestData[field] == undefined) continue;
                columns.push(field);
                placeholders.push('?');
                values.push(requestData[field]);
            }

            cmd = mysql.format(`insert into cs_return_scan_sequence(tracking) values('');
                    set @id=concat('A', LAST_INSERT_ID());
                    insert into cs_return(seq_no, ${columns.join()})
                    values(@id, ${placeholders.join()});
                    select @id;
                    SELECT concat('A', AUTO_INCREMENT) as next_id
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = "csreturn"
                    AND TABLE_NAME = "cs_return_scan_sequence"
                    ;`, values);

            let data = await DbServiceObj.executeSmQuery(cmd);
            actionType = ActionType.Add;
            if(!!data[3] && data[3].length > 0 && !!data[3][0]['@id']) {
                seqNo = data[3][0]['@id'];
            }

            if(!!data[4] && data[4].length > 0 && !!data[4][0]['next_id']) {
                nextSeqNo = data[4][0]['next_id'];
            }
        }
        */
        let selCmd = `SELECT count(*) AS count  FROM dl_return WHERE f_seq_no = "${requestData.f_seq_no}"`;
        let selData = await DbServiceObj.executeSmQuery(selCmd);
        selData = JSON.parse(JSON.stringify(selData[0]));
        if(selData.count > 0){
            //update
            cmd = `UPDATE dl_return SET ${columns.join('=?, ')} =? WHERE f_seq_no= "${requestData.f_seq_no}"`;
            await DbServiceObj.updateSmQuery(cmd, values);
            let response = AppUtil.responseJSON('1', [], 'Update successful.', true);
            res.send(response);
        }else{
            //insert
            cmd = mysql.format(`insert into dl_return (${columns.join()}) values(${placeholders.join(',')})`, values);
            let data = await DbServiceObj.executeSmQuery(cmd);
            actionType = ActionType.Add;
            if(data.length > 0) data = JSON.parse(JSON.stringify(data[0]));
            let response = AppUtil.responseJSON('1', [], 'Save Successfully', true);
            await this.addAuditLog(data.insertId, requestData.f_seq_no, requestData.user, actionType, JSON.stringify(req.body));
            res.send(response);
        }
    }

    async getNextSeqNo(req, res){
        let cmd = ` SELECT concat('A', AUTO_INCREMENT) as next_id
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = "csreturn"
                    AND TABLE_NAME = "cs_return_scan_sequence"`;

        let data = await DbServiceObj.executeSmQuery(cmd);
        let nextSeqNo = '';
        if(!!data && data.length > 0 && !!data[0]['next_id']) {
            nextSeqNo = data[0]['next_id'];
        }

        return res.send({
            nextSeqNo: nextSeqNo
        });
    }

    async findSkuByBarcode(req, res) {
        let barcode = req.query.barcode;
        let responseData = {
            sku: ''
        };
        if(!barcode) return res.send(responseData);

        let cmd = `select sku from SkuBarcode where sku_slave='${barcode}'`;
        let connection = await DbServiceObj.getSysDbConnection();
        let data = await connection.request().query(cmd);
        if(data.recordset.length > 0) {
            responseData.sku = data.recordset[0].sku
        }

        res.send(responseData);
    }

    async findTicket(req, res){
        let ordreNo = req.query.orderNo;
        let ret = {};
        if(!ordreNo || typeof ordreNo !== 'string') return res.send(ret);
        let cmd = `select top 1 [Ticket No.] as ticket_no from [SM_Ticket_Report] where [OMS Order No]='${ordreNo}'`;
        let connection = await DbServiceObj.getPowerBIDbConnection();
        let request = connection.request();
        let data = await request.query(cmd);
        if(!!data && !!data.recordset && data.recordset.length > 0){
            ret["ticketNo"] = data.recordset[0].ticket_no;
        }
        res.send(ret);
    }

    async getAllReturn(req, res){
        let cmd = `select seq_no, DATE_FORMAT(date, "%Y-%m-%d %H:%i:%s") as date, sku, barcode, job_no, unit_cost,
            delivery_tracking_no, order_no, customer_order_no, order_user_nick, post_est, return_reason,
            return_tracking_no, return_courier_name, user, ticket_no,
            note, process_asn, process_secondhand, process_type, update_salemessage
            from cs_return
            order by id`;
        let data = await DbServiceObj.executeSmQuery(cmd);
        res.send(data);
    }

    async updateReturn(req, res){
        // let data = req.body;
        // let seq_no = data.seq_no;
        // if(!seq_no) return res.send('');
        //
        // let cmd = `update cs_return set `;
        // let keys = Object.keys(data);
        // for(let key of keys){
        //     if(key == "seq_no") continue;
        //     cmd += `${key}='${data[key]}'`;
        // }
        //
        // cmd += ` where seq_no='${seq_no}'`;
        // console.log(cmd);
        // res.send('');
        // await DbServiceObj.executeSmQuery(cmd);

        let requestData = req.body;
        let cmd = '';
        let fields = ['f_barcode', 'f_delivery_tracking_no', 'f_customer_order_no', 'f_sku','f_seq_no','f_receiver',
            'f_job_no', 'f_process', 'f_process_asn', 'f_process_secondhand', 'f_result',
            'f_post_est', 'f_unit_cost', 'f_ticket_no', 'f_return_reason', 'f_return_courier_name',
            'f_return_tracking_no', 'f_order_no', 'f_receiver', 'f_note', 'f_create_userid', 'f_create_username'
        ];
        let columns = [];
        let values = [];
        for(let field of fields){
            if(requestData[field] == null || requestData[field] == undefined) continue;
            columns.push(field);
            values.push(requestData[field]);
        }
        cmd = `UPDATE dl_return SET ${columns.join('=?, ')} =? WHERE f_seq_no= "${requestData.f_seq_no}"`;
        let selCmd = `SELECT count(*) AS count  FROM dl_return WHERE f_seq_no = "${requestData.f_seq_no}"`;
        let selData = await DbServiceObj.executeSmQuery(selCmd);
        selData = JSON.parse(JSON.stringify(selData[0]));
        if(selData.count > 0){
            await DbServiceObj.updateSmQuery(cmd, values);
            let response = AppUtil.responseJSON('1', [], 'Update successful.', true);
            res.send(response);
        }else{
            res.send(AppUtil.responseJSON('1', [], 'The record does not exist.', true));
        }
    }

    async download(req, res) {
        let cmd = `select seq_no, DATE_FORMAT(date, "%Y-%m-%d %H:%i:%s") as date,
            return_reason, barcode, delivery_tracking_no, return_tracking_no, note,
            sku, return_courier_name, user, ticket_no, job_no,
            unit_cost, process_asn, process_secondhand, process_type, post_est,
            order_no, customer_order_no, order_user_nick, update_salemessage
            from cs_return
            order by id`;
        let data = await DbServiceObj.executeSmQuery(cmd);

        let xls = json2xls(data);
        let fileContents = Buffer.from(xls, "binary");
        let readStream = new stream.PassThrough();
        readStream.end(fileContents);
        res.set('Content-disposition', 'attachment; filename=' + 'download.xlsx');
        res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.set('Content-Length', xls.length);

        readStream.pipe(res);
    }

    async addAuditLog(returnid, seq_no, user, actionType: ActionType, data){
        if(typeof data !== 'string') data = JSON.stringify(data);
        let cmd = mysql.format(`insert into dl_return_audit_log(f_returnid, f_seq_no, f_user, f_action, f_data)
            values(?, ?, ?, ?, ?)`, [returnid, seq_no, user, ActionType[actionType], data]);
        await DbServiceObj.executeSmQuery(cmd);
    }

    async login(req, res){
        let data = req.body;
        let account = data.account;
        let password = data.password;
        // let cmd = `select f_loginname,f_password from dl_cs_user where f_loginname='${account}'`;
        // let row = await DbServiceObj.executeSmQuery(cmd);
        let $data = {
            "password": password,
            "timestamp" :new Date().getTime(),
            "username": account
        };
        AppUtil.postSmgLogin(req, res, 'http://dev.test.com/api/index/login', $data)

        /* TODO
        if(!!row[0] && typeof row[0] == "object"){
               if (row[0].f_password == crypto.createHash('md5').update(password).digest('hex')){
                   res.send({
                       msg:'Land successfully',
                       status: 1
                   })
               }else{
                   res.send({
                       msg:'Wrong password',
                       status: 2
                   })
               }
        }else{
            res.send({
                msg:'Account does not exist',
                status: 2
            })
        }
        */
    }

    async findDataBySeqNo(req, res){
        let data = req.body;

        let cmd = ` SELECT * FROM dl_return WHERE f_seq_no = '${data.seq_no}'`;
        let result = await DbServiceObj.executeSmQuery(cmd);
        if(result.length > 0) result = JSON.parse(JSON.stringify(result[0]));
        let response = AppUtil.responseJSON('1', [result], '查询成功', true);
        res.send(response);
    }
}
