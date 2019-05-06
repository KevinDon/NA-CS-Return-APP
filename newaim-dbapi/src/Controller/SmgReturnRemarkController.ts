import SmgController from "./Core/Extends/SmgController";
import {dl_return_remark} from "../Entity/SmgDlReturnRemark.entity";

class SmgReturnRemarkController extends SmgController{

    constructor (){
        super(dl_return_remark);
    }
}

const SmgReturnRemarkControllerObj = new SmgReturnRemarkController();
export {SmgReturnRemarkControllerObj}