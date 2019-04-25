import "reflect-metadata";
import {getRepository} from "typeorm";
import {dl_return_remark} from "../Entity/SmgDlReturn.entity";

class SmgReturnRemarkController{
    /*
    async getTypeOrmConnection() {
        this.smDbConnection = createConnection({
            type: "mysql",
            host: "127.0.0.1",
            port: 3306,
            username: "root",
            password: "123456",
            database: "sale_message",
            entities: [
                dl_return_remark
            ],
            synchronize: true,
            logging: false
        }).then(async  connection => {
           /*TODO
            let dl_return_orm = new DlReturnOrm();
            dl_return_orm.name = "Me and Bears";
            dl_return_orm.description = "I am near polar bears";
            dl_return_orm.filename = "photo-with-bears.jpg";
            dl_return_orm.views = 1;
            dl_return_orm.isPublished = true;

            connection.manager
                .save(dl_return_orm)
                .then(photo => {
                    console.log("dl_return_orm has been saved");
            await DlReturnOrmRepository.save(dl_return_orm);
            console.log("Photo has been saved");
                });
            let DlReturnOrmRepository = connection.getRepository(dl_return_remark);
            let savedPhotos = await DlReturnOrmRepository.findOne(52);
            console.log(dl_return_remark);
            return dl_return_remark;
            //this.getReturnRowById('52', dl_return_remark, connection);
        }).catch(error => console.log(error));
    }*/
    // private remarkRepository = getRepository(dl_return_remark);
    async getRowById(id){
        try{
            let remarkRepository = getRepository(dl_return_remark);
            return await remarkRepository.findOne(id);
        }catch(e){
            console.log('错误信息为：' + e)
        }
    }
}

const SmgReturnRemarkControllerObj = new SmgReturnRemarkController();
export {SmgReturnRemarkControllerObj}



