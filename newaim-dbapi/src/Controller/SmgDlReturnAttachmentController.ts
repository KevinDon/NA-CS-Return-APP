import SmgController from "./Core/Extends/SmgController";
import {dl_return_attachment} from "../Entity/SmgDlReturnAttachment.entity";

class SmgDlReturnAttachmentController extends SmgController{

    constructor (){
        super(dl_return_attachment);
    }
}

const SmgDlReturnAttachmentControllerObj = new SmgDlReturnAttachmentController();
export {SmgDlReturnAttachmentControllerObj}