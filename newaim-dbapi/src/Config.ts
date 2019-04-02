const OmsDbConfig = {
    host     : 'mysql_rds.newaim.com.au',
    user     : 'db_read',
    password : 'sear-XDz3#f',
    database : 'oms',
    connectTimeout : 50000
};

const SalesMessageDbConfig = {
    host     : '192.168.2.200',
    user     : 'root',
    password : 'Newaim#2018',
    database : 'salemessage_newaim_kelley',
    connectTimeout : 50000,
    multipleStatements: true
};

const SysDbConfig = {
    user: 'oms_adapter',
    password: 'abc.123',
    server: '10.1.1.75',
    database : 'CSReturn',
    connectionTimeout: 15000,//15000
    requestTimeout: 15000//15000
};

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
    database : 'PowerBI',
    connectionTimeout: 15000,//15000
    requestTimeout: 15000//15000
};

const ServerConfig = {
    port: 53300
};

export {OmsDbConfig, ServerConfig, SysDbConfig, PowerBIDbConfig, SalesMessageDbConfig}