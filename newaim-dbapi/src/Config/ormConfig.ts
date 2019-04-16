const ormConfig = {
    type: "mysql",
    host: "127.0.0.1",
    port: 3306,
    username: "root",
    password: "123456",
    database: "sale_message",
    synchronize: true,
    logging: false,
    entities: [
        // dl_return_remark
        "./Entity/SmgDlReturn.entity"
    ]
};
export {ormConfig}
