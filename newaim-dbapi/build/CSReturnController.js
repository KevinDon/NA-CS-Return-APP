"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const DbService_1 = require("./DbService");
const json2xls = require("json2xls");
const stream = require("stream");
const mysql = require("mysql");
var ActionType;
(function (ActionType) {
    ActionType[ActionType["Add"] = 0] = "Add";
    ActionType[ActionType["Update"] = 1] = "Update";
})(ActionType || (ActionType = {}));
class CSReturnController {
    findTicketByOrderNo(orderNo) {
        return __awaiter(this, void 0, void 0, function* () {
            let ticketNo = '';
            let cmd = `select top 1 [Ticket No.] as ticket_no from [SM_Ticket_Report] where [OMS Order No]='${orderNo}'`;
            let connection = yield DbService_1.DbServiceObj.getPowerBIDbConnection();
            let request = connection.request();
            let data = yield request.query(cmd);
            if (!!data && !!data.recordset && data.recordset.length > 0) {
                ticketNo = data.recordset[0].ticket_no;
            }
            return ticketNo;
        });
    }
    findDataByTracking1(tracking) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = `select top 1 *,  user_nick as order_user_nick  from [Tracking] where [delivery_tracking_no] = '${tracking}' 
            order by [oe_modified] desc, order_no desc, barcode`;
            let connection = yield DbService_1.DbServiceObj.getSysDbConnection();
            let data1 = yield connection.request().query(cmd);
            if (data1.recordset.length <= 0)
                return null;
            let row = data1.recordset[0];
            let orderNo = row.order_no;
            let sku = row.sku;
            cmd = `select top 1 [Ticket No.] as ticket_no, [Return Tracking Number] as return_tracking_no 
            from [PowerBI].[dbo].[SM_Ticket_Report]
            where [OMS Order No]='${orderNo}'         
            and (SKU = '' or SKU = '${sku}')   
            order by [Ticket No.] desc`;
            let data2 = yield connection.request().query(cmd);
            if (data2.recordset.length > 0) {
                row = Object.assign({}, row, data2.recordset[0]);
            }
            return row;
        });
    }
    findDataByTracking2(tracking) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = `select top 1 [OMS Order No] as order_no, [Ticket No.] as ticket_no, [Return Tracking Number] as return_tracking_no, 
            SKU as sku   
            from [PowerBI].[dbo].[SM_Ticket_Report] 
            where [Return Tracking Number] like '%${tracking}%'
            order by [Ticket No.] desc`;
            let connection = yield DbService_1.DbServiceObj.getSysDbConnection();
            let data1 = yield connection.request().query(cmd);
            if (data1.recordset.length <= 0)
                return null;
            let row = data1.recordset[0];
            let orderNo = row.order_no;
            let sku = row.sku;
            if (!!sku) {
                cmd = `select top 1 *, user_nick as order_user_nick  from [Tracking] where [order_no] = '${orderNo}'
                and sku = '${sku}'
                order by [oe_modified] desc, order_no desc, barcode`;
                let data2 = yield connection.request().query(cmd);
                if (data2.recordset.length > 0) {
                    row = Object.assign({}, row, data2.recordset[0]);
                }
            }
            return row;
        });
    }
    findDataByTracking(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let tracking = req.query.tracking;
            if (!tracking || typeof tracking !== 'string')
                return res.send('');
            tracking = tracking.replace('(', '').replace(')', '').trim();
            //re-submit of tracking
            let cmd = `select * 
            from cs_return where delivery_tracking_no='${tracking}' or return_tracking_no = '${tracking}'
            order by Id desc limit 1`;
            let connection = yield DbService_1.DbServiceObj.getSysDbConnection();
            let [data1, data2, data3] = yield Promise.all([
                this.findDataByTracking1(tracking),
                this.findDataByTracking2(tracking),
                DbService_1.DbServiceObj.executeSmQuery(cmd)
            ]);
            let responseData = data1;
            if (!data1 && !!data2)
                responseData = data2;
            if (!!data3 && data3.length > 0)
                responseData = data3[0];
            if (!responseData)
                responseData = {};
            res.send(responseData);
        });
    }
    saveReturn(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let requestData = req.body;
            let cmd = '';
            let seqNo = '';
            let nextSeqNo = '';
            let actionType = null;
            let fields = ['barcode', 'delivery_tracking_no', 'customer_order_no', 'sku',
                'job_no', 'process_type', 'process_asn', 'process_secondhand', 'result',
                'post_est', 'unit_cost', 'ticket_no', 'return_reason', 'return_courier_name',
                'return_tracking_no', 'order_no', 'order_user_nick', 'note', 'user'
            ];
            if (!!requestData.seq_no) {
                let updateColumns = [];
                let values = [];
                for (let field of fields) {
                    if (requestData[field] == null || requestData[field] == undefined)
                        continue;
                    updateColumns.push(`${field}=?`);
                    values.push(requestData[field]);
                }
                values.push(requestData.seq_no);
                cmd = mysql.format(`update cs_return set ${updateColumns.join()} where seq_no=?;
            SELECT concat('A', AUTO_INCREMENT) as next_id
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = "csreturn"
                    AND TABLE_NAME = "cs_return_scan_sequence" 
            `, values);
                seqNo = requestData.seq_no;
                actionType = ActionType.Update;
                let data = yield DbService_1.DbServiceObj.executeSmQuery(cmd);
                if (!!data[1] && data[1].length > 0 && !!data[1][0]['next_id']) {
                    nextSeqNo = data[1][0]['next_id'];
                }
            }
            else {
                let columns = [];
                let placeholders = [];
                let values = [];
                for (let field of fields) {
                    if (requestData[field] == null || requestData[field] == undefined)
                        continue;
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
                let data = yield DbService_1.DbServiceObj.executeSmQuery(cmd);
                actionType = ActionType.Add;
                if (!!data[3] && data[3].length > 0 && !!data[3][0]['@id']) {
                    seqNo = data[3][0]['@id'];
                }
                if (!!data[4] && data[4].length > 0 && !!data[4][0]['next_id']) {
                    nextSeqNo = data[4][0]['next_id'];
                }
            }
            res.send({
                status: 1,
                nextSeqNo: nextSeqNo
            });
            yield this.addAuditLog(seqNo, requestData.user, actionType, JSON.stringify(req.body));
        });
    }
    getNextSeqNo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = ` SELECT concat('A', AUTO_INCREMENT) as next_id
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = "csreturn"
                    AND TABLE_NAME = "cs_return_scan_sequence"`;
            let data = yield DbService_1.DbServiceObj.executeSmQuery(cmd);
            let nextSeqNo = '';
            if (!!data && data.length > 0 && !!data[0]['next_id']) {
                nextSeqNo = data[0]['next_id'];
            }
            return res.send({
                nextSeqNo: nextSeqNo
            });
        });
    }
    findSkuByBarcode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let barcode = req.query.barcode;
            let responseData = {
                sku: ''
            };
            if (!barcode)
                return res.send(responseData);
            let cmd = `select sku from SkuBarcode where sku_slave='${barcode}'`;
            let connection = yield DbService_1.DbServiceObj.getSysDbConnection();
            let data = yield connection.request().query(cmd);
            if (data.recordset.length > 0) {
                responseData.sku = data.recordset[0].sku;
            }
            res.send(responseData);
        });
    }
    findTicket(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let ordreNo = req.query.orderNo;
            let ret = {};
            if (!ordreNo || typeof ordreNo !== 'string')
                return res.send(ret);
            let cmd = `select top 1 [Ticket No.] as ticket_no from [SM_Ticket_Report] where [OMS Order No]='${ordreNo}'`;
            let connection = yield DbService_1.DbServiceObj.getPowerBIDbConnection();
            let request = connection.request();
            let data = yield request.query(cmd);
            if (!!data && !!data.recordset && data.recordset.length > 0) {
                ret["ticketNo"] = data.recordset[0].ticket_no;
            }
            res.send(ret);
        });
    }
    getAllReturn(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = `select seq_no, DATE_FORMAT(date, "%Y-%m-%d %H:%i:%s") as date, sku, barcode, job_no, unit_cost,
            delivery_tracking_no, order_no, customer_order_no, order_user_nick, post_est, return_reason, 
            return_tracking_no, return_courier_name, user, ticket_no,
            note, process_asn, process_secondhand, process_type, update_salemessage
            from cs_return
            order by id`;
            let data = yield DbService_1.DbServiceObj.executeSmQuery(cmd);
            res.send(data);
        });
    }
    updateReturn(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = req.body;
            let seq_no = data.seq_no;
            if (!seq_no)
                return res.send('');
            let cmd = `update cs_return set `;
            let keys = Object.keys(data);
            for (let key of keys) {
                if (key == "seq_no")
                    continue;
                cmd += `${key}='${data[key]}'`;
            }
            cmd += ` where seq_no='${seq_no}'`;
            console.log(cmd);
            res.send('');
            yield DbService_1.DbServiceObj.executeSmQuery(cmd);
        });
    }
    download(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = `select seq_no, DATE_FORMAT(date, "%Y-%m-%d %H:%i:%s") as date,
            return_reason, barcode, delivery_tracking_no, return_tracking_no, note,
            sku, return_courier_name, user, ticket_no, job_no,
            unit_cost, process_asn, process_secondhand, process_type, post_est,
            order_no, customer_order_no, order_user_nick, update_salemessage
            from cs_return            
            order by id`;
            let data = yield DbService_1.DbServiceObj.executeSmQuery(cmd);
            let xls = json2xls(data);
            let fileContents = Buffer.from(xls, "binary");
            let readStream = new stream.PassThrough();
            readStream.end(fileContents);
            res.set('Content-disposition', 'attachment; filename=' + 'download.xlsx');
            res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.set('Content-Length', xls.length);
            readStream.pipe(res);
        });
    }
    addAuditLog(seq_no, user, actionType, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof data !== 'string')
                data = JSON.stringify(data);
            let cmd = mysql.format(`insert into cs_return_audit_log(seq_no, user, action, data) 
            values(?, ?, ?, ?)`, [seq_no, user, ActionType[actionType], data]);
            yield DbService_1.DbServiceObj.executeSmQuery(cmd);
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = req.body;
            res.send({
                status: 1
            });
        });
    }
}
exports.default = CSReturnController;
//# sourceMappingURL=CSReturnController.js.map