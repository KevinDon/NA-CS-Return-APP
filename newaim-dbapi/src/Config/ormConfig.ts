const ormConfig =  {
    type: "mysql" as 'mysql',
    // host: "127.0.0.1",
    // port: 3306,
    // username: "root",
    // password: "123456",
    // database: "sale_message",
    host: "192.168.1.208",
    port: 3306,
    username: "root",
    password: "Dropship#123456",
    database: "salemessage_newaim_two",
    synchronize: true,
    logging: false,
    // entities: [
    //     // dl_return_remark
    //     "./Entity/SmgDlReturn.entity"
    // ]
};

export {ormConfig}
