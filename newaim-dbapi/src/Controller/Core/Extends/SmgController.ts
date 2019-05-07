import "reflect-metadata";
import {getRepository, getConnection} from "typeorm";
import AppUtil from "../../../Core/AppUtil";

export default class SmgController{

    private tableObj;

    constructor(name) {
        this.tableObj = name;
    }
    async getTable(){
        return this.tableObj;
    }

    async getRowByField(field){
        let remarkRepository = getRepository(this.tableObj);
        return this.checkRow(await remarkRepository.findOne(field));
    }

    async getRowByRowId(id){
        let remarkRepository = getRepository(this.tableObj);
        return this.checkRow(await remarkRepository.findOne(id));
    }

    async getAllRow(){
        let remarkRepository = getRepository(this.tableObj);
        return this.checkRow((await remarkRepository.find()));
    }

    async checkRow(result){
        if(result == undefined)
            return {};
        else
            return AppUtil.dbRowFormat(result);
    }
    async insertRow(values){
        return await getConnection()
            .createQueryBuilder()
            .insert()
            .into(this.tableObj)
            .values(values)
            .execute();
    }
}
