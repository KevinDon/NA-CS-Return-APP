const express = require('express');
const uuidv4 = require('uuid/v4');
const multer  = require('multer');
const config = require('./config');

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
  res.send({
    filename: req.file.filename,
    path: req.file.path,
    url: config.imageUrlRoot + '/' + req.file.filename
  })
});

app.post('/images/upload', upload.array('images', 10), function (req, res, next) {
  let responseData = [];
  if(!req.files || req.files.length == 0) return send(responseData);

  req.files.map(x => {
    responseData.push({
      filename: x.filename,
      path: x.path,
      url: config.imageUrlRoot + '/' + x.filename
    })
  });

  res.send(responseData);
});

app.listen(config.port);
console.log(`server listen at: ${config.port}`);