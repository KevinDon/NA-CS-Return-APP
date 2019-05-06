import "reflect-metadata";
import {getRepository} from "typeorm";
import AppUtil from "../../../Core/AppUtil";

export default class SmgController{

    private tableObj;

    constructor(name) {
        this.tableObj = name;
    }
    async getTableName(){
        return this.tableObj;
    }

    async getRowByField(field){
        let remarkRepository = getRepository(this.tableObj);
        return AppUtil.dbRowFormat(await remarkRepository.findOne(field));
    }

    async getRowByRowId(id){
        let remarkRepository = getRepository(this.tableObj);
        return AppUtil.dbRowFormat(await remarkRepository.findOne(id));
    }

    async getAllRow(){
        let remarkRepository = getRepository(this.tableObj);
        return AppUtil.dbRowFormat((await remarkRepository.find()));
    }
}
