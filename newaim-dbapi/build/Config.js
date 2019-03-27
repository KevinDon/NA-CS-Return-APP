"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OmsDbConfig = {
    host: 'mysql_rds.newaim.com.au',
    user: 'db_read',
    password: 'sear-XDz3#f',
    database: 'oms',
    connectTimeout: 50000
};
exports.OmsDbConfig = OmsDbConfig;
const SalesMessageDbConfig = {
    host: '10.1.1.208',
    user: 'root',
    password: 'asdf1234',
    database: 'csreturn',
    connectTimeout: 50000,
    multipleStatements: true
};
exports.SalesMessageDbConfig = SalesMessageDbConfig;
const SysDbConfig = {
    user: 'oms_adapter',
    password: 'abc.123',
    server: '10.1.1.75',
    database: 'CSReturn',
    connectionTimeout: 15000,
    requestTimeout: 15000 //15000
};
exports.SysDbConfig = SysDbConfig;
// const SysDbConfig = {
//     user: 'oms_adapter',
//     password: 'abc.123',
//     server: '10.1.1.20',
//     database : 'CSReturnApp',
//     connectionTimeout: 15000,//15000
//     requestTimeout: 15000//15000
// };
const PowerBIDbConfig = {
    user: 'powerbi',
    password: 'abc.123',
    server: '10.1.1.75',
    database: 'PowerBI',
    connectionTimeout: 15000,
    requestTimeout: 15000 //15000
};
exports.PowerBIDbConfig = PowerBIDbConfig;
const ServerConfig = {
    port: 53300
};
exports.ServerConfig = ServerConfig;
//# sourceMappingURL=Config.js.map