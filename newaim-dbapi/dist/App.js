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
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const methodOverride = require("method-override");
const QueryController_1 = require("./QueryController");
const Config_1 = require("./Config");
const CSReturnController_1 = require("./CSReturnController");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cors());
app.post('/queryoms', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new QueryController_1.default().queryOms(req, res); }));
app.get('/csreturn/findDataByTracking', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().findDataByTracking(req, res); }));
app.post('/csreturn/saveReturn', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().saveReturn(req, res); }));
app.get('/csreturn/findTicket', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().findTicket(req, res); }));
app.get('/csreturn/getAllReturn', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().getAllReturn(req, res); }));
app.post('/csreturn/updateReturn', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().updateReturn(req, res); }));
app.get('/csreturn/download', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().download(req, res); }));
app.get('/csreturn/findSkuByBarcode', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().findSkuByBarcode(req, res); }));
app.post('/csreturn/login', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().login(req, res); }));
app.get('/csreturn/getNextSeqNo', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().getNextSeqNo(req, res); }));
app.post('/csreturn/findDataBySeqNo', (req, res) => __awaiter(this, void 0, void 0, function* () { return yield new CSReturnController_1.default().findDataBySeqNo(req, res); }));
const port = Config_1.ServerConfig.port;
app.listen(port, () => {
    console.log(`Listening at ${port}`);
});
