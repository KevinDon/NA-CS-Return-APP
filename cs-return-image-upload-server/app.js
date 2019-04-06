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
    let name = uuidv4();
    cb(null, name) //File name after saving
  }
});

let upload = multer({ storage: storage });
let app = express();


app.post('/upload', upload.single('image'), function (req, res, next) {
    let data = {
        filename: req.file.filename,
        path: req.file.path,
        url: config.imageUrlRoot + '/' + req.file.filename + '.' + req.file.originalname.split('.').pop()
    };
    res.send(appUtil.responseJSON('1', [data], 'Successfully upload', true))
});

app.post('/images/upload', upload.array('images', 10), function (req, res, next) {
  let responseData = [];
  if(!req.files || req.files.length == 0) return send(responseData);

  req.files.map(x => {
    responseData.push({
      filename: x.filename,
      path: x.path,
      url: config.imageUrlRoot + '/' + x.filename + '.' + x.originalname.split('.').pop()
    })
  });

    res.send(appUtil.responseJSON('1', responseData , 'Successfully upload', true))
});

app.listen(config.port);
console.log(`server listen at: ${config.port}`);
