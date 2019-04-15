import {createConnection} from "typeorm";
import {dl_return_remark} from "../Entity/SmgDlReturn.entity";
export const  dbInit = async()  => {
    createConnection({
        type: "mysql",
        host: "127.0.0.1",
        port: 3306,
        username: "root",
        password: "123456",
        database: "sale_message",
        synchronize: true,
        logging: false,
        entities: [
            dl_return_remark
        ]
    }).then(async  connection => {
        console.log('数据库连接成功');
        return true;
    }).catch(error => {
        console.log('数据库连接失败');
        console.log(error);
        return false;
    });
}