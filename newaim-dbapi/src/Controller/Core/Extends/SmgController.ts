import "reflect-metadata";
import {getRepository, getConnection} from "typeorm";
import AppUtil from "../../../lib/AppUtil";

export default class SmgController{

    private tableObj;

    constructor(name) {
        this.tableObj = name
    }
    async getTable(){
        return this.tableObj
    }

    async getTableField(){
        return await getConnection().getMetadata(this.tableObj).ownColumns.map(column => column.propertyName);
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

    /**
     *
     * @param values
     * @return ids []
     */
    async insertRow(values){
        let reslut = await getConnection()
            .createQueryBuilder()
            .insert()
            .into(this.tableObj)
            .values(values)
            .execute();

        return reslut.identifiers;
    }

    /**
     *
     * @param values object
     * @param where object field value
     */
    async updateRow(values, where){
        try {
            await getConnection()
                .createQueryBuilder()
                .update(this.tableObj)
                .set(values)
                .where(where.filed, where.value)
                .execute();
        } catch (e) {
            console.log(e)
        }
    }
}
