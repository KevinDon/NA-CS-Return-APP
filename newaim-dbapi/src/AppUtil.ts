import * as request from "request";
import * as ksort from 'ksort';
import * as http_build_query from 'locutus/php/url/http_build_query';
import * as md5 from 'md5';
// import * as moment from "./CSReturnController";
import * as moment from 'moment';

export default class AppUtil{
    static postSmgLogin(req: any, res: any, url, data: any) {
        let smgUrl = url;
        let $data = this.encipherSMG(data);
        this.requestPostJson({
            url: smgUrl,
            data: $data,
            scope: this,
        }, (data)=> {
            res.send(data);
        })
    }

    static responseJSON(status: string, data: any[], msg:string, success:boolean,  _continue = true){
        let jsonObj = {
            status: status,
            data: data,
            msg: msg,
            success: success,
        };
        if(!_continue){
            console.log(jsonObj);
            return jsonObj;
        }else{
            return jsonObj;
        }
    }

    /**
     *
     * @param conf
     * @param callback
     */
    static async  requestPostJson(conf, callback){
        return  new Promise((resolve, reject) => {
            let options = conf || {};
            request.post({
                url: options.url,
                method: "POST",
                body: conf.data,
                json: true,
                headers: {
                    "content-type": "application/json",
                }
            }, (error, response, body) => {
                if (error || response.statusCode != 200) {
                    console.error('error posting json: ', error);
                }else if (!error && response.statusCode == 200) {
                    let result = [];
                    let postProcess = () => {
                        return new Promise((resolve, reject) => {
                            result.push(!!body.data ? body.data : {});
                            let response = this.responseJSON('1', result, body.msg, true);
                            resolve(response);
                        }).then((data) => {
                            if(callback) callback.call(conf.scope, data);
                        })
                    };
                    postProcess();
                }
            });
        })

    }

    static encipherSMG(data){
        let $data = data;
        let $key = "newaimsalemessage123456";//只有请求方和接收方知道的密钥
        $data = ksort($data);
        let $params = http_build_query($data);
        $data["secret"]  = md5($params + $key);
        return $data;
    }
    
    static momentToCN(){
        return moment(new Date()).subtract(10, 'h').add(8, 'h').format('YYYY-MM-DD HH:mm:ss');/*格式化当前时间时间*/
    }

    static dbRowFormat(result){
        return JSON.parse(JSON.stringify(result));
    }
}

