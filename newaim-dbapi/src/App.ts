import * as express from 'express'
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as methodOverride from "method-override";
import QueryController from "./QueryController";
import {ServerConfig} from "./Config/Config";
import {dbInit} from "./Controller/SmgServerController";
import CSReturnController from "./CSReturnController";






const app: express.Application = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cors());

app.post('/queryoms', async (req, res) => await new QueryController().queryOms(req, res));
app.get('/csreturn/findDataByTracking', async (req, res) => await new CSReturnController().findDataByTracking(req, res));
app.post('/csreturn/saveReturn', async (req, res) => await new CSReturnController().saveReturn(req, res));
app.get('/csreturn/findTicket', async (req, res) => await new CSReturnController().findTicket(req, res));
app.get('/csreturn/getAllReturn', async (req, res) => await new CSReturnController().getAllReturn(req, res));
app.post('/csreturn/updateReturn', async (req, res) => await new CSReturnController().updateReturn(req, res));
app.get('/csreturn/download', async (req, res) => await new CSReturnController().download(req, res));
app.get('/csreturn/findSkuByBarcode', async (req, res) => await new CSReturnController().findSkuByBarcode(req, res));
app.post('/csreturn/login', async (req, res) => await new CSReturnController().login(req, res));
app.get('/csreturn/getNextSeqNo', async (req, res) => await new CSReturnController().getNextSeqNo(req, res));
app.post('/csreturn/findDataBySeqNo', async (req, res) => await new CSReturnController().findDataBySeqNo(req, res));
app.post('/csreturn/testOrm', async (req, res) => await new CSReturnController().testOrm(req, res));

const port = ServerConfig.port;
app.listen(port, () => {
    console.log(`Listening at ${port}`);
});

//调用数据库
dbInit();
