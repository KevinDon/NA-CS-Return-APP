import {apiServer, imageServer, smApiServer} from './app.json';

export default class ApiClient{
  findDataByTracking = async tracking => {
    let url = apiServer + `/csreturn/findDataByTracking?tracking=${tracking}`;
    let response = await fetch(url);
    return await response.json();
  };

  saveReturn = async requestData => {
    let url = apiServer + `/csreturn/saveReturn`;

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    return await response.json();
  };

  findTicket = async orderNo => {
    let url = apiServer + `/csreturn/findTicket?orderNo=${orderNo}`;
    let response = await fetch(url);
    return await response.json();
  };

  findSkuByBarcode = async barcode => {
    let url = apiServer + `/csreturn/findSkuByBarcode?barcode=${barcode}`;

    let response = await fetch(url);
    return await response.json();
  };

  getNextSeqNo = async () => {
    let url = apiServer + `/csreturn/getNextSeqNo`;
    let response = await fetch(url);
    return await response.json();
  };

  uploadImages = async images => {
    if(!Array.isArray(images) || images.lengh == 0) return;

    const data = new FormData();
    let urls = [];
    for(let image of images){
      data.append('images', {
        uri: image,
        type: 'image/jpeg',
        name: 'images'
      });
      urls.push(image);
    }

    let requestUrl = imageServer + '/images/upload';
    let response = await fetch(requestUrl, {
      method: 'post',
      body: data
    });

    return await response.json();
  };

  login = async (account, password) => {
    let requestData = {
      account: account,
      password: password
    };
    let url = smApiServer + '/csreturn/login';
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    return await response.json();

    // let response = await fetch(requestUrl, {
    //   method: 'post',
    //   body: JSON.stringify(requestData)
    // });
    //
    // return await response.json();
  }

  //查找序列号
  findDataBySeqNo = async (SeqNo) =>{
      let requestData = {
          seq_no:SeqNo
      };
      let url = smApiServer + '/csreturn/findDataBySeqNo';
      let response = await fetch(url, {
          method: 'POST',
          headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
      });
      return await response.json();
  }

    //上传照片
    uploadimage = async (newphoto) =>{
        let url = imageServer + '/upload';
        let formData = new FormData();
        //console.log(url);
        let file = {uri:newphoto.uri,type:'multipart/form-data',name:newphoto.name};
        formData.append('image',file);
        formData.append('action','upload');
        //console.log(formData);
        let response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    }

    //多图上传
    uploadimages = async (photos) =>{
        let url = imageServer + '/images/upload';
        let formData = new FormData();

        for(let i=0;i<photos.length;i++){
            let uri = photos[i];
            let name =  photos[i].substring(photos[i].lastIndexOf("\/")+ 1, photos[i].length);
            let files = {uri:uri,type:'multipart/form-data',name:name};
            formData.append('images', files);
        }

        await formData.append('action','upload');
        let response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    }

}
