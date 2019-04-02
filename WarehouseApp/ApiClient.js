import {apiServer, imageServer, smApiServer} from './app.json';

export default class ApiClient{
  findDataByTracking = async tracking => {
    let url = apiServer + `/csreturn/findDataByTracking?tracking=${tracking}`;
    console.log(apiServer);
    console.log(url);
    let response = await fetch(url);
    // console.log('response转json',await response.json());
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
}
