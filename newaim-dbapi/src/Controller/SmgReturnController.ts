import SmgController from "./Core/Extends/SmgController";
import {dl_return} from "../Entity/SmgDlReturn.entity";

class SmgReturnController extends SmgController{

    constructor (){
        super(dl_return);
    }
}

const SmgReturnControllerObj = new SmgReturnController();
export {SmgReturnControllerObj}