const express = require('express');
const uuidv4 = require('uuid/v4');
const multer  = require('multer');
const config = require('./config');
const appUtil = require('./AppUtil');

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.imageFolder);
  },
  filename: function (req, file, cb) {
    // let name = uuidv4();
    let fileName = file.originalname.split('.');
    let name = '';
    for(let i = 0; i < fileName.length -1 ; i++){
        if(i == 0 )
            name = fileName[i];
        else
            name = name  +'.' +  fileName[i];
      }
      name = name + '_' +  Date.now() + '.' + fileName.pop();
    cb(null,name) //File name after saving
  }
});

let upload = multer({ storage: storage });
let app = express();


app.post('/upload', upload.single('image'), function (req, res, next) {
    console.log(req.file);
    let data = {
        filename: req.file.originalname,
        path: req.file.path,
        size:  req.file.size,
        type: req.file.mimetype,
        url: config.imageUrlRoot + '/' + req.file.filename
    };
    res.send(appUtil.responseJSON('1', [data], 'Successfully upload', true))
});

app.post('/images/upload', upload.array('images', 10), function (req, res, next) {
  let responseData = [];
  if(!req.files || req.files.length == 0) return send(responseData);

  req.files.map(x => {
    responseData.push({
        filename: x.originalname,
        path: x.path,
        size: x.size,
        type: x.mimetype,
        url: config.imageUrlRoot + '/' + x.filename
    })
  });
    res.send(appUtil.responseJSON('1', responseData , 'Successfully upload', true))
});

app.listen(config.port);
console.log(`server listen at: ${config.port}`);
