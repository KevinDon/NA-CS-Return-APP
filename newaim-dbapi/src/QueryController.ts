import {DbServiceObj} from "./DbService";

export default class QueryController {
    async queryOms(req, res) {
        let requestData = req.body;
        let quoteResponse = null;
        let data = await DbServiceObj.executeOmsQuery(requestData.cmd);
        res.send(data);
    }
}