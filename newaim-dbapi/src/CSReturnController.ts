import {DbServiceObj} from "./DbService";
import AppUtil from "./AppUtil";
import {SaleMessageApiConfig} from './saleMessageApi'
import * as mssql from 'mssql';
import * as json2xls from 'json2xls';
import * as fs from 'fs';
import * as stream from 'stream';
import * as mysql from 'mysql';
import * as moment from 'moment';
// import {SmgReturnRemarkControllerObj} from './Controller/SmgReturnController';
 import * as SmgServerControllerObj from './Controller/SmgServerController';
import {SmgReturnRemarkControllerObj} from "./Controller/SmgReturnController";


enum ActionType {
    Add,
    Update
}

export default class CSReturnController {
    async findTicketByOrderNo(orderNo: string) {
        let ticketNo = '';
        let cmd = `select top 1 [Ticket No.] as ticket_no from [SM_Ticket_Report] where [OMS Order No]='${orderNo}'`;
        let connection = await DbServiceObj.getPowerBIDbConnection();
        let request = connection.request();
        let data = await request.query(cmd);
        if (!!data && !!data.recordset && data.recordset.length > 0) {
            ticketNo = data.recordset[0].ticket_no;
        }
        return ticketNo;
    }

    async findDataByTrackingOms(tracking) {

        let cmd = `select top 1  user_nick as order_user_nick, barcode as f_barcode, delivery_tracking_no as f_delivery_tracking_no,customer_order_no as f_customer_order_no, sku as f_sku, job_no as f_job_no, unit_cost  as f_unit_cost, consignee as f_user_nick,address as f_address from [Tracking] where [delivery_tracking_no] = '${tracking}' order by [oe_modified] desc, order_no desc, barcode`;
        let SysConnection = await DbServiceObj.getSysDbConnection();
        let data1 = await SysConnection.request().query(cmd);
        if (data1.recordset.length <= 0) return null;

        let row = data1.recordset[0];
        let orderNo = row.order_no;
        let sku = row.sku;
        let $data = {
            "tracking_number": tracking,
            "timestamp": new Date().getTime(),
        };
        $data = AppUtil.encipherSMG($data);
        AppUtil.requestPostJson(
            {
                url: SaleMessageApiConfig.tracking,
                data: $data
            },
            function (json) {
                if (!!json && json.data.length > 0) {
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
        if (data2.length > 0) data2 = JSON.parse(JSON.stringify(data2[0]));
        if (!!data2 && data2.length > 0) {
            row = {row , data2}
        }
        return row;
    }

    async findDataByTracking2(tracking) {
        let cmd = `select top 1 [OMS Order No] as order_no, [Ticket No.] as ticket_no, [Return Tracking Number] as return_tracking_no, 
            SKU as sku   
            from [PowerBI].[dbo].[SM_Ticket_Report] 
            where [Return Tracking Number] like '%${tracking}%'
            order by [Ticket No.] desc`;
        let connection = await DbServiceObj.getSysDbConnection();
        let data1 = await connection.request().query(cmd);
        if (data1.recordset.length <= 0) return null;

        let row = data1.recordset[0];
        let orderNo = row.order_no;
        let sku = row.sku;
        if (!!sku) {
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
            "timestamp": new Date().getTime(),
        };
        $data = AppUtil.encipherSMG($data);
        AppUtil.requestPostJson(
            {
                url: SaleMessageApiConfig.tracking,
                data: $data
            },
            function (json) {
                if (!!json && json.data.length > 0) {
                    tracking = json.data.tracking_number;
                }
            });

        //re-submit of tracking
        // let cmd = `select *
        //     from cs_return where delivery_tracking_no='${tracking}' or return_tracking_no = '${tracking}'
        //     order by Id desc limit 1`;

        // let cmd = `SELECT * FROM dl_ticket_return_tracking WHERE f_tracking_number='${tracking}'`;
        let cmd = `SELECT tracking.f_ticketno, ticket.f_sku FROM dl_ticket_return_tracking AS tracking JOIN dl_ticket AS ticket ON tracking.f_ticketno = ticket.f_ticket_no WHERE tracking.f_tracking_number='${tracking}' ORDER BY ticket.f_ticket_no DESC`;
        //let connection = await DbServiceObj.getSysDbConnection();
        let [data1, data2] = await Promise.all([
            this.findDataByTrackingOms(tracking),
            //this.findDataByTracking2(tracking),
            // DbServiceObj.executeSmQuery(cmd)
            await DbServiceObj.executeSmQuery(cmd)
        ]);
        let responseData = data1;
        if (!data1 && !!data2) responseData = data2[0];
        //if(!!data3 && data3.length > 0) responseData = data3[0];
        if (!responseData) responseData = {};

        res.send(AppUtil.responseJSON('1', [responseData], 'Query Successful', true));
    }

    async saveReturn(req, res) {
        let me = this;
        let requestData = req.body;
        let cmd = '';
        let actionType = null;
        /*
        let fields = ['barcode', 'delivery_tracking_no', 'customer_order_no', 'sku',
            'job_no', 'process_type', 'process_asn', 'process_secondhand', 'result',
            'post_est', 'unit_cost', 'ticket_no', 'return_reason', 'return_courier_name',
            'return_tracking_no', 'order_no', 'order_user_nick', 'note', 'user'
        ];  */
        requestData['requestData'] = -1;
        let fields = [
            'f_barcode', 'f_delivery_tracking_no', 'f_customer_order_no', 'f_sku', 'f_seq_no', 'f_receiver',
            'f_job_no', 'f_process', 'f_process_asn', 'f_process_secondhand', 'f_result',
            'f_post_est', 'f_unit_cost', 'f_ticket_no', 'f_return_reason', 'f_return_courier_name','f_lastupdate_userid','f_lastupdate_username',
            'f_return_tracking_no', 'f_order_no', 'f_note', 'f_create_userid', 'f_create_username',
            'images',
        ];
        let columns = [];
        let placeholders = [];
        let values = [];
        let $operationHistory = {};
        let images;
        let selCmd = `SELECT *  FROM dl_return WHERE f_seq_no = "${requestData.f_seq_no}"`;
        let selData = await DbServiceObj.executeSmQuery(selCmd);
        let selDataObj;
        if(selData.length > 0) selDataObj = JSON.parse(JSON.stringify(selData[0]));
        for (let field of fields) {
            try{
                if (requestData[field] == null || requestData[field] == undefined){
                    continue
                }else if (!!requestData['images'] && requestData['images'].length > 0 && 'images' == field) {
                    images = requestData['images'];
                    requestData['images'] = '';
                    continue;
                }
                if(!!selDataObj && requestData[field] != selDataObj[field] && selData.length > 0 && field != 'images'){
                    let newValue = !!requestData[field] ? requestData[field] : '';
                    let oldValue = !!selDataObj[field] ? selDataObj[field] : '';
                    $operationHistory[field] = {};
                    $operationHistory[field][newValue] = oldValue;
                }
                if(field != 'images'){
                    columns.push(field);
                    placeholders.push('?');
                    values.push(requestData[field]);
                }
            }
            catch(e){
                console.log(e);
            }
        }
        $operationHistory = await me.compareAttachmentHandle(requestData.f_seq_no,images, $operationHistory);
        if (!!selDataObj && selData.length > 0) {
            let imageData = await me.uploadImageHandle(selDataObj.id, requestData.f_seq_no, images);
            cmd = `UPDATE dl_return SET ${columns.join('=?, ')} =? WHERE f_seq_no= "${requestData.f_seq_no}"`;
            // await this.addAuditLog(selData.id, requestData.f_seq_no, requestData.f_create_userid, actionType, JSON.stringify(req.body)).then(function(){
            // });
            let createDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss'); /*格式化当前时间时间*/
            if(Object.keys($operationHistory).length != 0){
                let historyCmd = `INSERT INTO dl_return_operation_history (f_returnid, f_seq_no, f_operation_history, f_create_userid, f_create_date)  VALUES('${selDataObj.id}', '${requestData.f_seq_no}', '${JSON.stringify($operationHistory)}', '${requestData.f_create_userid}', '${createDate}')`;
                await me.saveReturnNote(selDataObj.id, requestData);
                await DbServiceObj.executeSmQuery(historyCmd)
            }
            DbServiceObj.updateSmQuery(cmd, values);
            let response = AppUtil.responseJSON('1', [], 'Update successful.', true);
            res.send(response);
        }else {
            //insert
            cmd = mysql.format(`INSERT INTO dl_return (${columns.join()})  VALUES(${placeholders.join(',')})`, values);
            let data = await DbServiceObj.executeSmQuery(cmd);
            await me.saveReturnNote(data.insertId, requestData);
            actionType = ActionType.Add;
            if (data.length > 0) data = JSON.parse(JSON.stringify(data[0]));
            let imageResponse = this.uploadImageHandle(data.insertId, requestData.f_seq_no, images);
            let response = AppUtil.responseJSON('1', [], 'Save Successfully', true);
            //await this.addAuditLog(data.insertId, requestData.f_seq_no, requestData.f_create_userid, actionType, JSON.stringify(req.body));
            res.send(response);
        }
    }

    async getNextSeqNo(req, res) {
        let cmd = ` SELECT concat('A', AUTO_INCREMENT) as next_id
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = "csreturn"
                    AND TABLE_NAME = "cs_return_scan_sequence"`;

        let data = await DbServiceObj.executeSmQuery(cmd);
        let nextSeqNo = '';
        if (!!data && data.length > 0 && !!data[0]['next_id']) {
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
        if (!barcode) return res.send(responseData);

        let cmd = `select sku from SkuBarcode where sku_slave='${barcode}'`;
        let connection = await DbServiceObj.getSysDbConnection();
        let data = await connection.request().query(cmd);
        if (data.recordset.length > 0) {
            responseData.sku = data.recordset[0].sku
        }
        let response = AppUtil.responseJSON('1', [responseData], 'Query Successfully', true);
        res.send(response);
    }

    async findTicket(req, res) {
        let ordreNo = req.query.orderNo;
        let ret = {};
        if (!ordreNo || typeof ordreNo !== 'string') return res.send(ret);
        let cmd = `select top 1 [Ticket No.] as ticket_no from [SM_Ticket_Report] where [OMS Order No]='${ordreNo}'`;
        let connection = await DbServiceObj.getPowerBIDbConnection();
        let request = connection.request();
        let data = await request.query(cmd);
        if (!!data && !!data.recordset && data.recordset.length > 0) {
            ret["ticketNo"] = data.recordset[0].ticket_no;
        }
        res.send(ret);
    }

    async getAllReturn(req, res) {
        let cmd = `select seq_no, DATE_FORMAT(date, "%Y-%m-%d %H:%i:%s") as date, sku, barcode, job_no, unit_cost,
            delivery_tracking_no, order_no, customer_order_no, order_user_nick, post_est, return_reason,
            return_tracking_no, return_courier_name, user, ticket_no,
            note, process_asn, process_secondhand, process_type, update_salemessage
            from cs_return
            order by id`;
        let data = await DbServiceObj.executeSmQuery(cmd);
        res.send(data);
    }

    async updateReturn(req, res) {
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
        let fields = ['f_barcode', 'f_delivery_tracking_no', 'f_customer_order_no', 'f_sku', 'f_seq_no', 'f_receiver',
            'f_job_no', 'f_process', 'f_process_asn', 'f_process_secondhand', 'f_result',
            'f_post_est', 'f_unit_cost', 'f_ticket_no', 'f_return_reason', 'f_return_courier_name',
            'f_return_tracking_no', 'f_order_no', 'f_note', 'f_create_userid', 'f_create_username'
        ];
        let columns = [];
        let values = [];
        for (let field of fields) {
            if (requestData[field] == null || requestData[field] == undefined) continue;
            columns.push(field);
            values.push(requestData[field]);
        }
        cmd = `UPDATE dl_return SET ${columns.join('=?, ')} =? WHERE f_seq_no= "${requestData.f_seq_no}"`;
        let selCmd = `SELECT count(*) AS count  FROM dl_return WHERE f_seq_no = "${requestData.f_seq_no}"`;
        let selData = await DbServiceObj.executeSmQuery(selCmd);
        selData = JSON.parse(JSON.stringify(selData[0]));
        if (selData.count > 0) {
            await DbServiceObj.updateSmQuery(cmd, values);
            let response = AppUtil.responseJSON('1', [], 'Update successful.', true);
            res.send(response);
        } else {
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

    async addAuditLog(returnid, seq_no, userId, actionType: ActionType, data) {
        // if (typeof data !== 'string') data = JSON.stringify(data);
        // let cmd = mysql.format(`insert into dl_return_operation_history(f_returnid, f_seq_no, f_user, f_action, f_data)
        //     values(?, ?, ?, ?, ?)`, [returnid, seq_no, user, ActionType[actionType], data]);
        // await DbServiceObj.executeSmQuery(cmd);
        AppUtil.requestPostJson({
            url: SaleMessageApiConfig.historyLog,
            data: {
                'return_id' : returnid,
                'user_id' : userId,
                'data' : data
            }
        }, null);
    }

    async login(req, res) {
        let data = req.body;
        let account = data.account;
        let password = data.password;
        // let cmd = `select f_loginname,f_password from dl_cs_user where f_loginname='${account}'`;
        // let row = await DbServiceObj.executeSmQuery(cmd);
        let $data = {
            "password": password,
            "timestamp": new Date().getTime(),
            "username": account
        };
        AppUtil.postSmgLogin(req, res, SaleMessageApiConfig.login , $data)

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

    async findDataBySeqNo(req, res) {
        let data = req.body;
        let cmd = ` SELECT * FROM dl_return WHERE f_seq_no = '${data.seq_no}'`;
        let result = await DbServiceObj.executeSmQuery(cmd);
        if (result.length > 0) result = JSON.parse(JSON.stringify(result[0]));
        let response = AppUtil.responseJSON('1', [result], 'Query Successful', true);
        res.send(response);
    }

    async saveReturnNote(returnId, requestData){
        let createDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss'); /*格式化当前时间时间*/
        let remarkCmd = `INSERT INTO dl_return_remark (f_returnid, f_seq_no, f_remark, f_create_userid, f_create_date)  VALUES('${returnId}', '${requestData.f_seq_no}', '${requestData.f_note}', '${requestData.f_create_userid}', '${createDate}')`;
        DbServiceObj.executeSmQuery(remarkCmd)
    }

    async uploadImageHandle(returnId, seqNo, images) {
        if(!!images && images.length > 0){
            let createDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss'); /*格式化当前时间时间*/
            if (!!images && images.length > 0) {
                for (let index = 0; index < images.length; index++) {
                    let attachmentCmd = '';
                    try {
                        let image = images[index];
                        attachmentCmd = `insert into dl_return_attachment (f_returnid, f_seq_no, f_type, f_file_url, f_file_size, f_create_date, f_file_name) values('${returnId}','${seqNo}', '${image.type}',  '${image.url}', '${image.size}', '${createDate}', '${image.filename}')`;
                        DbServiceObj.executeSmQuery(attachmentCmd);
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        }
    }
    async compareAttachmentHandle(seq_no, images, operationHistory){
        let documents = [];
        let imagesArr = [];
        let cmd = ` SELECT f_file_name FROM dl_return_attachment WHERE f_seq_no = '${seq_no}'`;
        let selData = await DbServiceObj.executeSmQuery(cmd);
        if (!!selData && selData.length > 0)
            selData = JSON.parse(JSON.stringify(selData));
        else
            selData='';
        for(let index in selData){
            documents.push(selData[index]['f_file_name']);
        }
        if(!!images && images.length > 0) {
            for (let index = 0; index < images.length; index++) {
                imagesArr.push(images[index].filename);
            }
            let docs = documents.concat(imagesArr).join(';');
            operationHistory[docs] = imagesArr.join(';');
        }
        return operationHistory
    }

    async testOrm(req, res){
        let result = await SmgReturnRemarkControllerObj.getRowById(52);
        result = AppUtil.dbRowFormat(result);
        console.log(result.f_remark);
    }
}

