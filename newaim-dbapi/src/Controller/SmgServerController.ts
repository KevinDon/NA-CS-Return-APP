import {createConnection} from "typeorm";
import {ormConfig} from "../Config/ormConfig";
import {dl_return_remark} from "../Entity/SmgDlReturnRemark.entity";
import {dl_return} from "../Entity/SmgDlReturn.entity";
import {dl_return_attachment} from "../Entity/SmgDlReturnAttachment.entity";

export const dbInit = async()  => {
    //注册数据表
    ormConfig['entities'] = [
        dl_return_remark,
        dl_return,
        dl_return_attachment
    ];
    await createConnection(ormConfig).then(async  connection => {
        console.log('数据库连接成功');
        return true;
    }).catch(error => {
        console.log('数据库连接失败');
        console.log(error);
        return false;
    });
}
