module.exports = {
    responseJSON : function (status, data, msg, success,  _continue) {
        let jsonObj = {
            status: status,
            data: data,
            msg: msg,
            success: success,
        };
        if(!!_continue){
            console.log(jsonObj);
            return jsonObj;
        }else{
            return jsonObj;
        }
    }
}


