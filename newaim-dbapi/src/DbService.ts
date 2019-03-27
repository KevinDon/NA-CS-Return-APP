import * as mysql from 'mysql';
import * as mssql from 'mssql';
import {OmsDbConfig, SysDbConfig, PowerBIDbConfig, SalesMessageDbConfig} from "./Config";

class DbService {
    private omsDbConnection: any;
    private sysDbConnection: any;
    private powerbiDbConnection: any;
    private smDbConnection: any;
    getOmsDbConnection(){
        if(!this.omsDbConnection || this.omsDbConnection.state == 'disconnected'){
            this.omsDbConnection = mysql.createConnection(OmsDbConfig);
            this.omsDbConnection.connect();

            this.omsDbConnection.on('error', error => {
                this.omsDbConnection = null;
            });
        }

        return this.omsDbConnection;
    }

    async executeOmsQuery(cmd){
        return new Promise<any>(async (resolve, reject) => {
            let omsDbConnection = this.getOmsDbConnection();
            omsDbConnection.query(cmd, function (err, rows, fields) {
                if(!!err) reject();
                return resolve(rows);
            });
        })
    }

    getSmDbConnection(){
        if(!this.smDbConnection || this.smDbConnection.state == 'disconnected'){
            this.smDbConnection = mysql.createConnection(SalesMessageDbConfig);
            this.smDbConnection.connect();

            this.smDbConnection.on('error', error => {
                this.smDbConnection = null;
            });
        }

        return this.smDbConnection;
    }

    async executeSmQuery(cmd){
        return new Promise<any>(async (resolve, reject) => {
            let connectoin = this.getSmDbConnection();
            connectoin.query(cmd, function (err, rows, fields) {
                if(!!err) reject();
                return resolve(rows);
            });
        })
    }

    async getSysDbConnection(){
        if(!this.sysDbConnection){
            try {
                this.sysDbConnection = await new mssql.ConnectionPool(SysDbConfig).connect();
                this.sysDbConnection.on('error', error => {
                    this.sysDbConnection = null;
                })
            }catch (e) {
                this.sysDbConnection = null;
            }
        }
        return this.sysDbConnection;
    }

    async getPowerBIDbConnection(){
        if(!this.powerbiDbConnection){
            try {
                this.powerbiDbConnection = await new mssql.ConnectionPool(PowerBIDbConfig).connect();
                this.powerbiDbConnection.on('error', error => {
                    this.powerbiDbConnection = null;
                })
            }catch (e) {
                this.powerbiDbConnection = null;
            }
        }
        return this.powerbiDbConnection;
    }
}

const DbServiceObj = new DbService();
export {DbServiceObj}