"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const ksort = require("ksort");
const http_build_query = require("locutus/php/url/http_build_query");
const md5 = require("md5");
class AppUtil {
    static postSmgLogin(req, res, url, data) {
        let smgUrl = url;
        let $data = this.encipherSMG(data);
        this.requestPostJson({
            url: smgUrl,
            data: $data,
            scope: this,
        }, (data) => {
            res.send(data);
        });
    }
    static responseJSON(status, data, msg, success, _continue = true) {
        let jsonObj = {
            status: status,
            data: data,
            msg: msg,
            success: success,
        };
        if (!_continue) {
            console.log(jsonObj);
            return jsonObj;
        }
        else {
            return jsonObj;
        }
    }
    /**
     *
     * @param conf
     * @param callback
     */
    static requestPostJson(conf, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
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
                    }
                    else if (!error && response.statusCode == 200) {
                        let result = [];
                        let postProcess = () => {
                            return new Promise((resolve, reject) => {
                                result.push(!!body.data ? body.data : {});
                                let response = this.responseJSON('1', result, body.msg, true);
                                resolve(response);
                            }).then((data) => {
                                if (callback)
                                    callback.call(conf.scope, data);
                            });
                        };
                        postProcess();
                    }
                });
            });
        });
    }
    static encipherSMG(data) {
        let $data = data;
        let $key = "newaimsalemessage123456"; //只有请求方和接收方知道的密钥
        $data = ksort($data);
        let $params = http_build_query($data);
        $data["secret"] = md5($params + $key);
        return $data;
    }
}
exports.default = AppUtil;
