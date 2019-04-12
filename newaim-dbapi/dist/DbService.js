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
const mysql = require("mysql");
const mssql = require("mssql");
const Config_1 = require("./Config");
class DbService {
    getOmsDbConnection() {
        if (!this.omsDbConnection || this.omsDbConnection.state == 'disconnected') {
            this.omsDbConnection = mysql.createConnection(Config_1.OmsDbConfig);
            this.omsDbConnection.connect();
            this.omsDbConnection.on('error', error => {
                this.omsDbConnection = null;
            });
        }
        return this.omsDbConnection;
    }
    executeOmsQuery(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let omsDbConnection = this.getOmsDbConnection();
                omsDbConnection.query(cmd, function (err, rows, fields) {
                    if (!!err)
                        reject();
                    return resolve(rows);
                });
            }));
        });
    }
    getSmDbConnection() {
        if (!this.smDbConnection || this.smDbConnection.state == 'disconnected') {
            this.smDbConnection = mysql.createConnection(Config_1.SalesMessageDbConfig);
            this.smDbConnection.connect();
            this.smDbConnection.on('error', error => {
                this.smDbConnection = null;
            });
        }
        return this.smDbConnection;
    }
    executeSmQuery(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let connectoin = this.getSmDbConnection();
                connectoin.query(cmd, function (err, rows, fields) {
                    if (!!err)
                        reject();
                    return resolve(rows);
                });
            })).catch((err) => {
                console.log(err);
            });
        });
    }
    updateSmQuery(cmd, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let connectoin = this.getSmDbConnection();
                connectoin.query(cmd, params, function (err, rows, fields) {
                    if (!!err)
                        reject(err);
                    return resolve(rows);
                });
            })).catch((err) => {
                console.log(err);
            });
        });
    }
    getSysDbConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.sysDbConnection) {
                try {
                    this.sysDbConnection = yield new mssql.ConnectionPool(Config_1.SysDbConfig).connect();
                    this.sysDbConnection.on('error', error => {
                        this.sysDbConnection = null;
                    });
                }
                catch (e) {
                    this.sysDbConnection = null;
                }
            }
            return this.sysDbConnection;
        });
    }
    getPowerBIDbConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.powerbiDbConnection) {
                try {
                    this.powerbiDbConnection = yield new mssql.ConnectionPool(Config_1.PowerBIDbConfig).connect();
                    this.powerbiDbConnection.on('error', error => {
                        this.powerbiDbConnection = null;
                    });
                }
                catch (e) {
                    this.powerbiDbConnection = null;
                }
            }
            return this.powerbiDbConnection;
        });
    }
}
const DbServiceObj = new DbService();
exports.DbServiceObj = DbServiceObj;
