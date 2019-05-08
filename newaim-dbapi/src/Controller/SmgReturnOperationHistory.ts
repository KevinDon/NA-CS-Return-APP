import SmgController from "./Core/Extends/SmgController";
import {dl_return_operation_history} from "../Entity/SmgDlReturnOperationHistory.entity";

class SmgReturnOperationHistoryController extends SmgController{

    constructor (){
        super(dl_return_operation_history);
    }
}

const SmgReturnOperationHistoryControllerObj = new SmgReturnOperationHistoryController();
export {SmgReturnOperationHistoryControllerObj}
