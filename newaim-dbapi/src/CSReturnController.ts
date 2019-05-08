import {DbServiceObj} from "./DbService";
import AppUtil from "./lib/AppUtil";
import {SaleMessageApiConfig} from './Config/saleMessageApiConfig'
import * as json2xls from 'json2xls';
import * as stream from 'stream';
import * as mysql from 'mysql';
import {SmgReturnRemarkControllerObj} from "./Controller/SmgReturnRemarkController";
import {SmgReturnControllerObj} from "./Controller/SmgReturnController";
import {SmgDlReturnAttachmentControllerObj} from "./Controller/SmgDlReturnAttachmentController";
import {SmgReturnOperationHistoryControllerObj} from "./Controller/SmgReturnOperationHistory";


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

        cmd = `SELECT ticket.f_ticket_no, ticket.f_tracking_number as return_tracking_no, ticket_sku.f_sku  FROM dl_ticket ticket LEFT JOIN dl_ticket_sku ticket_sku ON ticket.f_ticket_no = ticket_sku.f_ticketno  WHERE ticket.f_oms_order_id='${orderNo}' AND ticket_sku.f_sku = '${sku}' ORDER BY f_add_time DESC LIMIT 1`;

        //cmd = `SELECT f_sku, f_ticket_no AS f_ticketno FROM dl_return WHERE f_delivery_tracking_no='${tracking}' ORDER BY f_create_date DESC LIMIT 1`;
        let data2 = await DbServiceObj.executeSmQuery(cmd);
        if (data2.length > 0) data2 = JSON.parse(JSON.stringify(data2[0]));
        if (!!data2 && Object.keys(data2).length > 0) {
            data2.f_tracking_no = tracking;
            row = {oms: row , smg: data2}
        }else{
            row =  {oms: row, smg : {}}
        }
        row.smg['f_tracking_no'] = tracking;
        return row;
        //订单编号，SKU都符合
        // cmd = `select f_ticket_no, f_tracking_number as return_tracking_no
        //             from dl_ticket
        //             where [OMS Order No]='${orderNo}'
        //             and (f_sku = '' or f_sku = '${sku}')
        //             order by [Ticket No.] desc`;
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
        let me = this;
        let tracking = req.query.tracking;
        let type = req.query.type; //1为Delivery Tracking No.，2为Return Tracking No.
        if (!tracking || typeof tracking !== 'string') return res.send('');
        tracking = tracking.replace('(', '').replace(')', '').trim();

        // let cmd = `select f_loginname,f_password from dl_cs_user where f_loginname='${account}'`;
        // let row = await DbServiceObj.executeSmQuery(cmd);
        let $trackingData = {
            "timestamp": new Date().getTime(),
            "tracking_number": tracking,
        };
        $trackingData = await AppUtil.encipherSMG($trackingData);
        await AppUtil.requestPostJson({
                url: SaleMessageApiConfig.tracking,
                data: $trackingData
            }, async function(json){
            if (!!json && !!json.data[0]&& json.data.length > 0) {
                let cmd = '';
                let seqNoCmd = '';
                let smgTracking = json.data[0].tracking_number;
                // let cmd = `SELECT * FROM dl_ticket_return_tracking WHERE f_tracking_number='${tracking}'`;
                if(type == 1){
                    //Delivery Tracking
                    cmd = `SELECT f_sku, f_ticket_no AS f_ticketno, f_seq_no FROM dl_return WHERE f_delivery_tracking_no='${smgTracking}' ORDER BY f_create_date DESC LIMIT 1`;
                    seqNoCmd = `SELECT * FROM dl_return WHERE f_delivery_tracking_no='${smgTracking}' ORDER BY f_create_date DESC LIMIT 1`;
                }else if(type ==2){
                    //Return Tracking 'f_process',  'f_return_reason', 'f_return_courier_name'
                   cmd = `SELECT tracking.f_ticketno, ticket.f_sku FROM dl_ticket_return_tracking AS tracking JOIN dl_ticket AS ticket ON tracking.f_ticketno = ticket.f_ticket_no WHERE tracking.f_tracking_number='${smgTracking}' ORDER BY ticket.f_ticket_no DESC LIMIT 1`;
                   seqNoCmd = `SELECT * FROM dl_return WHERE f_return_tracking_no='${smgTracking}' ORDER BY f_create_date DESC LIMIT 1`;
                }
                //seqNoCmd = `SELECT f_seq_no FROM dl_return WHERE f_return_tracking_no='${smgTracking}' ORDER BY f_create_date DESC LIMIT 1`;
                //let connection = await DbServiceObj.getSysDbConnection();
                let [data1,  data2, data3] = await Promise.all([
                    await me.findDataByTrackingOms(smgTracking),
                    //this.findDataByTracking2(tracking),
                    // DbServiceObj.executeSmQuery(cmd)
                    await DbServiceObj.executeSmQuery(cmd),
                    await DbServiceObj.executeSmQuery(seqNoCmd)
                ]);
                let responseData = data1;
                if (!data1 && !!data2 && data2.length > 0){
                    data2 = JSON.parse(JSON.stringify(data2[0]));
                    data2.f_tracking_no = smgTracking;
                    responseData = {oms: {},  smg: data2 };
                   // console.log(responseData)
                }else if (!responseData || responseData.length == 0){
                    responseData = {oms: {},  smg: {f_tracking_no: smgTracking} };
                }else{
                    responseData['smg'].f_tracking_no = smgTracking;
                }
                if(!!data3 && data3.length > 0) {
                    for(let key in data3[0]){
                        responseData['smg'][key] = data3[0][key];
                    }
                }
                //if(!!data3 && data3.length > 0) responseData = data3[0];
                // let ticket = await me.findTicket(tracking);
                res.send(AppUtil.responseJSON('1', [responseData], 'Query Successful', true));
            }
        })
        //re-submit of tracking
        // let cmd = `select *
        //     from cs_return where delivery_tracking_no='${tracking}' or return_tracking_no = '${tracking}'
        //     order by Id desc limit 1`;
    }

    async saveReturn(req, res) {
        let me = this;
        let requestData = req.body;
        let cmd = '';
        let actionType = null;
        requestData['requestData'] = -1;
        let fields = [
            'f_barcode', 'f_delivery_tracking_no', 'f_customer_order_no', 'f_sku', 'f_seq_no', 'f_receiver',
            'f_job_no', 'f_process', 'f_process_asn', 'f_process_secondhand', 'f_result',
            'f_post_est', 'f_unit_cost', 'f_ticket_no', 'f_return_reason', 'f_return_courier_name','f_lastupdate_userid','f_lastupdate_username',
            'f_return_tracking_no', 'f_order_no', 'f_note', 'f_create_userid', 'f_create_username',
            'images',
        ];
        let columnsValue = {};
        let $operationHistory = {};
        let images = requestData['images'];
        let currentDate = AppUtil.momentToCN(); /*格式化当前时间时间*/

        let selData = await SmgReturnControllerObj.getRowByField( {f_seq_no : requestData.f_seq_no});
        for (let field of fields) {
            try{
                if (requestData[field] == null || requestData[field] == undefined){
                    continue
                }else if ('images' == field) {
                    // requestData['images'] =  '';
                    continue;
                }
                $operationHistory = await me.generateOperation(selData, requestData, field, $operationHistory);
                columnsValue[field] = requestData[field];
            }
            catch(e){
                console.log(e);
            }
        }
        $operationHistory = await me.compareAttachmentHandle(requestData.f_seq_no,images, $operationHistory);

        if (!!selData && Object.keys(selData).length > 0) {
            //Update
            //增加最后修改时间
            columnsValue['f_lastupdate_date'] = currentDate;
            await me.relatedTableProcessing(selData.id, requestData);
            if(Object.keys($operationHistory).length != 0){
                let history = {};
                //TODO
                let historyField = await SmgReturnOperationHistoryControllerObj.getTableField();
                //处理数据
                history['f_returnid'] =selData.id;
                history['f_seq_no'] = requestData.f_seq_no;
                history['f_operation_history'] = JSON.stringify($operationHistory);
                history['f_create_userid'] = requestData.f_lastupdate_userid;
                history['f_create_date'] = currentDate;
                await SmgReturnOperationHistoryControllerObj.insertRow(history);
            }

            await SmgReturnControllerObj.updateRow(
                columnsValue,
                {
                    field : 'f_seq_no= :f_seq_no',
                    value: {f_seq_no : requestData.f_seq_no}
                });
            let response = AppUtil.responseJSON('1', [], 'Update successful.', true);
            res.send(response);
        }else {
            //Insert
            //增加创建时间
            columnsValue['f_create_date'] = currentDate;
            let insertIds = await SmgReturnControllerObj.insertRow(columnsValue);
            await me.saveReturnNote(insertIds[0].id, requestData);
            if(!!images && images.length > 0){
                await this.uploadImageHandle(insertIds[0].id, requestData.f_seq_no, images);
            }
            let response = AppUtil.responseJSON('1', [], 'Save Successfully', true);
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
        /*TODO
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
        */
        // let cmd = `SELECT f_ticket_no,f_return_method,f_return_amount,f_return_initiated,f_return_received,f_inspection_outcome,f_sku FROM dl_ticket WHERE f_ticket_no in (SELECT f_ticketno FROM dl_ticket_return_tracking WHERE f_tracking_number='${tracking}')`;
        // let ticketData = await DbServiceObj.executeSmQuery(cmd);
        // if (ticketData.length > 0)
        //     return JSON.parse(JSON.stringify(ticketData[0]));
        // else
        //     return {}
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

        let result = await SmgReturnControllerObj.getRowByField( {f_seq_no : data.seq_no});
        let remarkResult = await SmgReturnRemarkControllerObj.getRowByField({ f_seq_no: data.seq_no});

        if (!!remarkResult && Object.keys(remarkResult).length > 0){
            result.f_note = remarkResult.f_remark;
        }else{
            result.f_note = ''
        }

        let response = AppUtil.responseJSON('1', [result], 'Query Successful', true);
        res.send(response);
    }

    async compareAttachmentHandle(seq_no, images, operationHistory){
        let documents = [];
        let imagesArr = [];

        // let cmd = `SELECT f_file_name FROM dl_return_attachment WHERE f_seq_no = '${seq_no}'`;
        // let selData = await DbServiceObj.executeSmQuery(cmd);

        let selData = await SmgDlReturnAttachmentControllerObj.getRowByField({f_seq_no : seq_no});

        if (!!selData && Object.keys(selData).length > 0){
            for(let index in selData){
                documents.push(selData[index]['f_file_name']);
            }
        }

        if(!!images && images.length > 0){
            for(let index = 0; index < images.length; index ++){
                imagesArr.push(images[index].filename);
            }
            let docs = documents.concat(imagesArr).join(';');
            operationHistory['f_attachment'] = {};
            operationHistory['f_attachment'][docs] = documents.join(';');
        }
        console.log(operationHistory);
        return operationHistory
    }

    async saveReturnNote(returnId, requestData){
        let createDate = AppUtil.momentToCN();
        let selDataCmd =`SELECT * FROM dl_return_remark WHERE f_seq_no='${requestData.f_seq_no}'  ORDER BY id desc limit 1`;
        let selData = await DbServiceObj.executeSmQuery(selDataCmd);
        if (!!selData && selData.length > 0){
            selData = JSON.parse(JSON.stringify(selData));
        }

        //检测数据库是否已存在NOTE
        if(selData.length == 0 && !!requestData.f_note){
            let remarkCmd = `INSERT INTO dl_return_remark (f_returnid, f_seq_no, f_remark, f_create_userid, f_create_date)  VALUES('${returnId}', '${requestData.f_seq_no}', '${requestData.f_note}', '${requestData.f_lastupdate_userid}', '${createDate}')`;
            DbServiceObj.executeSmQuery(remarkCmd);
        }else if(!!selData && selData.length > 0){//检测存在的NOTE记录是否与当前提交的NOTE是否相同
            if(selData[0]['f_remark'] != requestData.f_note){
                let remarkCmd = `INSERT INTO dl_return_remark (f_returnid, f_seq_no, f_remark, f_create_userid, f_create_date)  VALUES('${returnId}', '${requestData.f_seq_no}', '${requestData.f_note}', '${requestData.f_lastupdate_userid}', '${createDate}')`;
                DbServiceObj.executeSmQuery(remarkCmd);
            }
        }
    }

    async uploadImageHandle(returnId, seqNo, images) {
        //todo
        let rowField = ['f_type', 'f_file_url', 'f_file_size', 'f_file_name'];
        let proImages = [];
        if(!!images && images.length > 0){
            let createDate = AppUtil.momentToCN()
            if (!!images && images.length > 0) {
                for (let index = 0; index < images.length; index++) {
                    let attachment = {};
                    let image = images[index];
                    try {
                        attachment['f_returnid'] = returnId;
                        attachment['f_seq_no'] = seqNo;
                        attachment['f_create_date'] = createDate;

                        attachment['f_type'] = image.type;
                        attachment['f_file_url'] = image.url;
                        attachment['f_file_size'] = image.size;
                        attachment['f_file_name'] = image.filename;
                        proImages.push(attachment);
                    } catch (e) {
                        console.log(e);
                    }
                }
                await SmgDlReturnAttachmentControllerObj.insertRow(proImages);
            }
        }
    }


    async testOrm(req, res){
        let result = await SmgReturnOperationHistoryControllerObj.getTableField();
        console.log(result);
        return ;
        result = AppUtil.dbRowFormat(result);
        let response = AppUtil.responseJSON('1', [result],'Query Successful', true);
        res.send(response);
        //console.log(result.f_remark);
    }

    /**
     *
     * @param oldData
     * @param newData
     * @param field
     * @param operationHistory
     */
    async generateOperation(oldData, newData, field, operationHistory){
        //operation 过滤ID、Images  field != 'images' && field != 'f_note' && field != 'f_lastupdate_userid' || field != 'f_create_userid'
        let filterArr = ['images', 'f_note', 'f_lastupdate_userid', 'f_create_userid'];
        for(let index in filterArr){
            if(field == filterArr[index]) return operationHistory;
        }

        //保存时对比新旧值
        if((newData[field] != '' && newData[field] != null) && Object.keys(oldData).length > 0 && newData[field] != oldData[field]) {
            let newValue = !!newData[field] ? newData[field] : '';
            let oldValue = !!oldData[field] ? oldData[field] : '';
            operationHistory[field] = {};
            operationHistory[field][newValue] = oldValue;
        }
        return operationHistory;
    }

    async relatedTableProcessing(id, requestData){
        await this.uploadImageHandle(id, requestData.f_seq_no, requestData.images);
        await this.saveReturnNote(id, requestData);
    }
}

