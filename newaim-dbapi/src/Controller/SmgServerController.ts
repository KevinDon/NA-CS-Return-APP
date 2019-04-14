import "reflect-metadata";
import {createConnection} from "typeorm";
import {dl_return_remark} from "../Entity/SmgDlReturnEntity";
// export default class SmgServerController {
//     smgDbConnection = createConnection({
//         type: "mysql",
//         host: "127.0.0.1",
//         port: 3306,
//         username: "root",
//         password: "123456",
//         database: "sale_message",
//         synchronize: true,
//         logging: false,
//         entities: [
//             __dirname + "../Entity/*.js"
//         ],
//     }).then(async  connection => {
//         let DlReturnRemarkRepository = connection.getRepository(dl_return_remark);
//         let DlReturnRemark = await DlReturnRemarkRepository.findOne(52);
//         console.log(DlReturnRemark);
//     }).catch(error => console.log(error));
// }

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
    ],
}).then(async  connection => {
    let DlReturnRemarkRepository = connection.getRepository(dl_return_remark);
    let DlReturnRemark = await DlReturnRemarkRepository.findOne(52);
    console.log(DlReturnRemark);
}).catch(error => console.log(error));