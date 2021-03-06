import React from 'react';
import {Platform, StyleSheet, Text, View, Image, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Alert, findNodeHandle,TouchableHighlight} from 'react-native';
import {Header, Card, Button, ButtonGroup, Icon, FormLabel } from 'react-native-elements';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import BarcodeScanner from "./components/BarcodeScanner";
import PhotoCamera from "./components/PhotoCamera";
import ApiClient from "./ApiClient";
import {returnReasons, returnCouriers, version, asnOptions, processTypes, imageServer} from './app.json';
import RNPickerSelect from 'react-native-picker-select';
import {ImagePicker, Permissions,} from 'expo';

const ProcessType = {
  ASN: 'asn',
  SecondHand: 'second_hand',
  Dispose: 'dispose',
  SEV1: 'SEV1'
};

const ViewMode = {
  Scanning: 1,
  Loading: 2,
  Details: 3,
  EnterBarcode: 4,
  Login: 5,
  TakePhoto:6,
  PhotoSelect:7
};

const ScanType = {
  Tracking: 0,
  SKUBarcode: 1,
  DeliveryTracking: 2,
  ReturnTracking: 3,
  SeqNum:4
};

export default class App extends React.Component {
  inputRefs = {};
  state = {
    viewMode: ViewMode.Details,
    scanType: '',
    images: [],
    showStatus: false,
    submitStatus: false,
    submitMsg: '',
    waittingupload:false,
    uploadimg:[],
    uploadimgs:false,
    uploadedimg:[],
    addreturn:true,
    currenUser:'',
    currenUserId:'',
    trackno:'',

    errorStatus: false,
    errorMsg: '',

    defaultReturnReason: 'Other',
    defaultReturnCourier: 'Other',

    next_seq_no: {
      label: 'Seq No.',
      value: ''
    },


    productDetails: {
      f_barcode: {
        label: "Barcode",
        value: ''
      },
      f_sku: {
        label: "SKU",
        value: ''
      },
      f_job_no: {
        label: "Job No",
        value: ''
      },
      f_unit_cost: {
        label: "Unit Cost",
        value: 0
      },
      // delivery_courier: {
      //   label: "Delivery Courier",
      //   value: ''
      // },
      f_delivery_tracking_no: {
        label: "Delivery Tracking No",
        value: ''
      },
      f_post_est: {
        label: "Post Est",
        value: 0
      },
      f_order_no: {
        label: "OMS Order No",
        value: ''
      },
      f_customer_order_no: {
        label: "Customer Order No",
        value: ''
      },
      f_user: {
        label: "User Id",
        value: ''
      },
    },
    returnDetails: {
      f_seq_no: {
        value: ''
      },
      f_receiver: {
        label: 'Receiver',
        value: ''
      },
      f_ticket_no: {
        label: 'Ticket No',
        value: ''
      },
      f_return_reason: {
        label: 'Return Reason',
        value: ''
      },
      f_return_courier_name: {
        label: 'Return Courier',
        value: ''
      },
      f_return_tracking_no: {
        label: 'Return Tracking No',
        value: ''
      },
      process: {
        label: 'Process',
        value: ''
      },
      f_process: {
        label: 'Process Type',
        value: ''
      },
      f_process_asn: {
        label: 'ASN',
        value: ''
      },
      f_process_secondhand: {
        label: 'Secondhand',
        value: ''
      },
      f_result: {
        label: 'Result',
        value: ''
      },
      f_note: {
        label: 'Note',
        value: ''
      },
      f_create_username:{
        label: 'Create Username',
        value: ''
      },
      f_create_userid:{
        label: 'Create UserId',
        value: ''
      },
      f_lastupdate_userid:{
        label: 'Lastupdate Userid',
          value: ''
      },
      f_lastupdate_username:{
        label: 'Lastupdate UserNAME',
        value: ''
      },
    }
  };

  componentDidMount() {
    // this.test();
    // this.handleReturnUpdate('process_secondhand', this.getDefaultProcessSecondHandValue());
    // this.setProcessSecondHandWithDefaultValue();
    //this.getNextSeqNo();
    this.setState({
      viewMode: ViewMode.Login
    });
    this.setProcessSecondHandWithDefaultValue();
  }

  updateNextSeqNo = seqNo => {
    let newData = JSON.parse(JSON.stringify(this.state.next_seq_no));
    newData.value = seqNo;
    this.setState({
      next_seq_no: newData
    })
  };

  getNextSeqNo = async () => {
    let client = new ApiClient();
    let data = await client.getNextSeqNo();
    if(!!data && !!data.nextSeqNo){
      this.updateNextSeqNo(data.nextSeqNo);
    }
  };

  getDefaultProcessSecondHandValue = () => {
    return 's' + new Date().getFullYear();
  };

  setProcessSecondHandWithDefaultValue = () => {
    this.handleReturnUpdate('f_process_secondhand', this.getDefaultProcessSecondHandValue());
  };

  userLogin = () => {
    this.clearData();
    this.setState({
      next_seq_no:{
        label: 'Seq No.',
        value: ''
      },
      viewMode: ViewMode.Login
    });
  };

  handleLogin = async (account, password) => {
    this.setState({
      viewMode: ViewMode.Loading
    });

    let client = new ApiClient();
    let responseData = await client.login(account, password);

    if(responseData.msg==="success"){
      this.setState({
        viewMode: ViewMode.Details,
        currenUser:responseData.data[0].username,
        currenUserId:responseData.data[0].userId
      });
      this.handleReturnUpdate('f_receiver', account);
    }else{
      this.setState({
        viewMode: ViewMode.Login,
      });
      Alert.alert(
        'Login Failed',
        'No account or Password error',
        [{text: 'OK'}],
      );
      return;
    }
  };

  handleCancelScan = () => {
    this.setState({
      viewMode: ViewMode.Details
    })
  };

  //parse scanned data
  parseScanDataByCamera = (result) => {
    const eParcelPrefix = '019931265099999891';
    const eParcelDelimitter = "\u001d";
    if(!result || !result.data || !result.type) return null;

    let data = result.data;
    let trackingNo = '';

    if((result.type === 16 || result.type.toString().toUpperCase() === 'ORG.ISO.DATAMATRIX') && data.indexOf(eParcelPrefix) >= 0){
      //EPARCEL
      let tmp1 = data.split(eParcelDelimitter);
      // tracking = JSON.stringify(tmp);
      let tmp2 = '';
      if(tmp1.length > 0) {
        if(!!tmp1[0]) tmp2 = tmp1[0];
        else if(!!tmp1[1]) tmp2 = tmp1[1];
      }

      // let index = tmp2.indexOf(eParcelNAPrefix);
      trackingNo = tmp2;
    } else if(result.type === 256 || result.type.toString().toUpperCase() === 'ORG.ISO.QRCODE') {
      //TOLL
      let tmp = data.split(' ');
      trackingNo = tmp[0];
    } else if(result.type === 1
      || result.type === 2
      || result.type.toString().toUpperCase() === 'ORG.ISO.CODE39'
      || result.type.toString().toUpperCase() === 'ORG.ISO.CODE128' ){
      //barcode
      trackingNo = data;
      let index = data.indexOf(']C1');
      if(index >= 0) {
        trackingNo = data.slice(3);
      }
    }

    // trackingNo = JSON.stringify(result);
    return trackingNo;
  };

  handleScanTracking = async (scanData) => {
    let trackingNo = this.parseScanData(scanData);
    if(!!trackingNo) {
      await this.loadDetails(trackingNo);
    } else {
      this.setState({
        errorMsg: 'Failed to read tracking no from code'
      });
    }

    return {
      // errorMsg: 'test ' + trackingNo,
      barcode: trackingNo
    }
  };

  handleScanSkuBarcode = async (scanData) => {
    let barcode = scanData.data;
    this.handleProductUpdate('barcode', barcode);
    await this.findSkuByBarcode(barcode);
  };

  findSkuByBarcode = async (barcode) => {
    if(!barcode) return;

    this.setState({
      viewMode: ViewMode.Loading
    });

    let sku = '';
    let apiClient = new ApiClient();
    let responseData = await apiClient.findSkuByBarcode(barcode);

    if(!!responseData) {
      if(!!responseData.data && !!responseData.data.length > 0 && !!responseData.data[0].sku){
        sku = responseData.data[0].sku;
      }else{
        Alert.alert(
          'Search completed',
          'No relevant SKU',
          [
            {text: 'OK'},
          ],
        );
      }
    }
    this.handleProductUpdate('f_sku', sku);

    this.setState({
      viewMode: ViewMode.Details
    });
  };

  parseTrackingScanData = (trackingScanData) => {
    console.log(trackingScanData);
    if(!trackingScanData || trackingScanData.trim() == '') return;

    const eParcelPrefix = '019931265099999891';
    const eParcelDelimitter = "\u001d";
    let trackingNo = trackingScanData;
    if(trackingScanData.indexOf(eParcelPrefix) >= 0) {
      let tmp1 = trackingScanData.split(eParcelDelimitter);
      if(tmp1.length > 0){
        trackingNo = tmp1[0];
      }
    }

    return trackingNo;
  };

  handleScanDeliveryTracking = async(scanData) => {
    let trackingNo = this.parseTrackingScanData(scanData);
    if(!trackingNo) return;
    await this.loadDetails(trackingNo,1);
    trackingNo = this.state.trackno;
	console.log(trackingNo);
    await this.handleProductUpdate('f_delivery_tracking_no', trackingNo);
  };

  handleScanReturnTracking = async(scanData) => {
    let trackingNo = this.parseTrackingScanData(scanData);
    if(!trackingNo) return;
    await this.loadDetails(trackingNo,2);
    trackingNo = this.state.trackno;
	console.log(trackingNo);
    await this.handleReturnUpdate('f_return_tracking_no', trackingNo);
  };

  handleBarcodeRead = async (scanData) => {
    const {scanType} = this.state;
    if(scanType === ScanType.DeliveryTracking) {
      return await this.handleScanDeliveryTracking(scanData.data);
    }  else if(scanType === ScanType.ReturnTracking) {
      return await this.handleScanReturnTracking(scanData.data);
    } else if(scanType === ScanType.SeqNum){
      this.handleScanSeqNum(scanData);
    }else {
      return await this.handleScanSkuBarcode(scanData);
    }
  };

  loadDetails = async(tracking,type) => {
    if(!tracking || tracking.trim() === '') return;

    this.setState({
      viewMode: ViewMode.Loading,
      errorStatus: false,
      errorMsg: ''
    });

    let newProductDetails = JSON.parse(JSON.stringify(this.state.productDetails));
    let newReturnDetails = JSON.parse(JSON.stringify(this.state.returnDetails));
    let newNextSeqNo = JSON.parse(JSON.stringify(this.state.next_seq_no));
    let errorStatus = false;
    let errorMsg = '';
    let viewMode = ViewMode.Details;

    try{
      let client = new ApiClient();
      let response = await client.findDataByTracking(tracking,type);
      for (let key of Object.keys(response.data[0].smg)) {
        if(newProductDetails.hasOwnProperty(key) && !newProductDetails[key].value){
          newProductDetails[key].value = response.data[0].smg[key];
        } else if(newReturnDetails.hasOwnProperty(key) && !newReturnDetails[key].value) {
          newReturnDetails[key].value = response.data[0].smg[key];
        }
      }

      if(!response.data[0].oms.f_sku && !!response.data[0].smg.f_sku ){
          newProductDetails['f_sku'].value = response.data[0].smg['f_sku'];
      }
      if(!!response.data[0].smg.f_ticketno){
          newReturnDetails['f_ticket_no'].value = response.data[0].smg['f_ticketno'];
      }

      console.log(response.data[0]);
      if(!!response.data[0].smg.f_tracking_no){
          this.setState({
             trackno: response.data[0].smg.f_tracking_no
          });
      }else{
          this.setState({
              trackno: ''
          });
      }

      if(type==1){
          newReturnDetails['f_return_tracking_no'].value =this.state.returnDetails.f_return_tracking_no.value;
      }else if(type==2) {
          newProductDetails['f_delivery_tracking_no'].value= this.state.productDetails.f_delivery_tracking_no.value;
      }

      if(!!response.data[0].smg.f_seq_no){
          newNextSeqNo.value= response.data[0].smg.f_seq_no
      }

      if(!!response.data[0].smg.f_process_secondhand){
          newReturnDetails['f_process_secondhand'].value = response.data[0].smg.f_process_secondhand;
      }


    } catch (e) {
      this.clearData();
      errorStatus = true;
      errorMsg = `Failed to get data for tracking ${tracking}`;
    }
    this.setState({
      next_seq_no:newNextSeqNo,
      productDetails: newProductDetails,
      returnDetails: newReturnDetails,
      errorStatus: errorStatus,
      errorMsg: errorMsg,
      viewMode: viewMode
    });
  };

  test = async() => {
    await this.loadDetails('NEW327412003');
  };

  pickImage = async() => {
    let image = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false
    });

    if(!image.cancelled) {
      this.setState({
        images: this.state.images.concat([image.uri]),
      });
    }
  };

  removeImage = (index) => {
    let images = this.state.images.filter((e, i) => i != index);
    this.setState({
      images: images
    })
  };

  test2 = async () => {
    let photo = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false
    });

    const file = {
      uri: photo.uri,
      name: 'sampleFile',
      type: photo.type
    };

    let client = new ApiClient();
    let responseData = await client.uploadImage(photo);
    this.setState({
      submitMsg: JSON.stringify(responseData)
    });
  };

  uploadImages = async() => {
    const {images} = this.state;
    if(!images || images.length == 0) return;

    let client = new ApiClient();
    return await client.uploadImages(images);

    // this.setState({
    //   submitMsg: JSON.stringify(responseData)
    // });
  };

  handleEnterBarcode = () => {
    this.setState({
      viewMode: ViewMode.EnterBarcode
    })
  };

  handleEnterBarcodeCancel = () => {
    this.setState({
      viewMode: ViewMode.Details
    })
  };

  handleEnterBarcodeSubmit = async (trackingNo) => {
    await this.loadDetails(trackingNo);
  };

  handleStartTrackingScan = () => {
    this.setState({
      viewMode: ViewMode.Scanning,
      scanType: ScanType.Tracking
    });
  };

  handleStartSkuBarcodeScan = () => {
    this.setState({
      viewMode: ViewMode.Scanning,
      scanType: ScanType.SKUBarcode
    });
  };

  handleStartDeliveryTrackingScan = () => {
    this.setState({
      viewMode: ViewMode.Scanning,
      scanType: ScanType.DeliveryTracking
    });
  };

  handleStartReturnTrackingScan = () => {
    this.setState({
      viewMode: ViewMode.Scanning,
      scanType: ScanType.ReturnTracking
    });
  };

  handleStartTakingPhoto = async () => {
    //if(Platform.OS!=='android'){
    await Permissions.askAsync(Permissions.CAMERA);
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    //}
    let photos = await ImagePicker.launchCameraAsync({
      allowsEditing:false,
      quality:0.1
    });


    if(photos.cancelled!==true){
      this.setState({
        waittingupload:true,
        uploadimg:this.state.uploadimg.concat([photos.uri])
      })
    }else{
      this.setState({
        waittingupload:false,
        uploadimg:[],
      })
    }
  };

  //照相回调函数
  handleTakingPhoto = async (scope) =>{
    let photo = await scope.camera.takePictureAsync();
    let uri = photo.uri;
    scope.returnImage();
  };

  hanldeSeqNoUpdate = (text) =>{
    if(!!text){
      this.setState({next_seq_no: {label: 'Seq No.', value: text}})
    }else{
      this.setState({next_seq_no: {label: 'Seq No.', value: ""}})
    }
  };

  handleProductUpdate = (key, value) => {
    let newData = JSON.parse(JSON.stringify(this.state.productDetails));
    newData[key].value = value;
    this.setState({
      productDetails: newData
    });
  };

  handleReturnUpdate = (key, value) => {
    let newData = JSON.parse(JSON.stringify(this.state.returnDetails));
    newData[key].value = value;
    this.setState({
      returnDetails: newData
    });
  };

  handleSubmit = async () => {
    const {next_seq_no,productDetails, returnDetails} = this.state;

    //序列号验证
    if(!this.state.next_seq_no.value){
      Alert.alert(
        'Submit',
        'The Seq No can not be empty',
        [
          {text: 'OK'}
        ],
      );
      return;
    }

    //快递单号验证
    let returnReason = returnDetails.f_return_reason.value;
    let skipCheckReason = ['Label lost', "Customer's own"];
      if(this.state.returnDetails.f_return_reason.value!=='label_lost'){
          if(!productDetails.f_delivery_tracking_no.value
              && !returnDetails.f_return_tracking_no.value
              && skipCheckReason.indexOf(returnReason) < 0) {
              Alert.alert(
                  'Submit',
                  'Please provide a delivery or a return tracking no before submission',
                  [
                      {text: 'OK'},
                  ],
              );
              return;
          }
      }


    this.setState({
      viewMode: ViewMode.Loading
    });


    let requestData = {};
    let keys = Object.keys(this.state.productDetails);
    keys.map(x => requestData[x] = this.state.productDetails[x].value);

    keys = Object.keys(this.state.returnDetails);
    keys.map(x => requestData[x] = this.state.returnDetails[x].value);

    //process type
    if(returnDetails.f_process.value === ProcessType.ASN){
      requestData['f_process_secondhand'] = '';
    } else if(returnDetails.f_process.value === ProcessType.SecondHand){
      requestData['f_process_asn'] = '';
    } else {
      requestData['f_process_asn'] = '';
      requestData['f_process_secondhand'] = '';
    }
    //images
    // let imageUploadData = await this.uploadImages();
    // if(!!imageUploadData) {
    //   requestData['images'] = imageUploadData.map(x => x.url);
    // }

    let imgdata = this.state.uploadedimg;
    requestData['images']=[];

    if(!!this.state.uploadedimg){
      for(let i=0;i<imgdata.length;i++){
        let newimgdata ={
          f_file_name:imgdata[i].filename,
          f_file_size:1024,//imgdata[i].size,
          f_type:'jpg',//imgdata[i].type
        };
        requestData['images'].push(imgdata[i]);
      }
    }

    let client = new ApiClient();
    requestData['f_seq_no']=this.state.next_seq_no.value;
    if(!!this.state.addreturn){
        requestData['f_create_userid'] = this.state.currenUserId;
        requestData['f_create_username'] =this.state.currenUser;
        requestData['f_lastupdate_userid'] = this.state.currenUserId;
        requestData['f_lastupdate_username'] =this.state.currenUser;
    }else{
        requestData['f_lastupdate_userid'] = this.state.currenUserId;
        requestData['f_lastupdate_username'] =this.state.currenUser;
    }
    console.log(requestData);
    let responseData = await client.saveReturn(requestData);


    // if(!!responseData && !!responseData.nextSeqNo){
    //   this.updateNextSeqNo(responseData.nextSeqNo)
    // }
    this.clearData();
    // this.hanldeSeqNoUpdate();

    let submitStatus = true;
    let submitMsg = 'A product return has been submitted';
    if(!responseData || !responseData.status) {
      submitStatus = false;
      submitMsg = 'Failed to submit';
    }

    setTimeout(() => {
      this.setState({
        submitMsg: ''
      })
    }, 5000);

    this.setState({
      showStatus: true,
      submitStatus: submitStatus,
      submitMsg: submitMsg,
      viewMode: ViewMode.Details,
      uploadedimg:[],
      addreturn:true,
    });
  };

  handleSubmitAndScan = async() => {
    await this.handleSubmit();
    this.setState({
      viewMode: ViewMode.Scanning,
      scanType: ScanType.Tracking
    })
  };

  handlePressHome = () => {
    let {viewMode} = this.state;
    if(viewMode == ViewMode.Details){
      this.handleClearData();
    }else{
      this.setState({
        viewMode: ViewMode.Details
      })
    }
  };

  handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'Are you sure to clear all the data?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => {
            this.clearData();
            this.setState({
              viewMode: ViewMode.Details
            })
          }},
      ],
    )
  };

  clearData = () => {
    let newProductDetails = JSON.parse(JSON.stringify(this.state.productDetails));
    Object.keys(newProductDetails).map(key => {
      if(typeof newProductDetails[key].value === 'number') newProductDetails[key].value = 0;
      else newProductDetails[key].value = '';
    });

    let newReturnDetails = JSON.parse(JSON.stringify(this.state.returnDetails));
    Object.keys(newReturnDetails).map(key => {
      if(key === 'f_receiver') return;
      if(typeof newReturnDetails[key].value === 'number') newReturnDetails[key].value = 0;
      else newReturnDetails[key].value = '';
    });

    if(!newReturnDetails.f_process_secondhand.value) {
      newReturnDetails.f_process_secondhand.value = this.getDefaultProcessSecondHandValue();
    }

    let newSeqNo = JSON.parse(JSON.stringify(this.state.next_seq_no));
    newSeqNo.value = '';

    this.setState({
      next_seq_no: newSeqNo,
      productDetails: newProductDetails,
      returnDetails: newReturnDetails,
      showStatus: false,
      submitStatus: false,
      submitMsg: '',
      errorStatus: false,
      errorMsg: '',
    })
  };

  focusNextField = nextField => {
    this.refs[nextField].focus();
  };

  renderHeader = () => {
    return (
      <Header
        //leftComponent={{ icon: 'home', color: '#fff', onPress: () => {this.handlePressHome()}}}
        centerComponent={{ text: 'New Aim ' + version, style: { color: '#fff' } }}
        rightComponent={{ icon: 'user', type: 'font-awesome', color: '#fff', onPress: () => {this.userLogin()}}}
        outerContainerStyles={{borderBottomWidth: 0, height: Platform.OS === 'ios' ? 70 :  80}}
      />
    )
  };

  renderError = () => {
    const {errorStatus, errorMsg} = this.state;
    if(errorStatus) {
      return <View style={styles.errorContainer}><Text>{errorMsg}</Text></View>;
    }
  };

  renderLoginView = () => {
    let username = '';
    let password = '';
    return(
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        {this.renderHeader()}
        <View style={{flex:1, justifyContent: 'center'}}>
          <Card title='Sign In'>
            <Text>{this.state.errorMsg}</Text>
            <FormLabel>Account</FormLabel>
            <TextInput style={styles.textInput}
                       autoFocus={true}
                       autoCorrect={false}
                       onChangeText={(text) => {username = text}}
            />
            <FormLabel>Password</FormLabel>
            <TextInput style={styles.textInput}
                       autoCorrect={false}
                       secureTextEntry={true}
                       onChangeText={(text) => {password = text}}
            />
            <View style={{flexDirection: 'row-reverse', marginTop: 20}}>
              <Button title='Sign In' onPress={() => this.handleLogin(username, password)}></Button>
            </View>
          </Card>
        </View>
      </KeyboardAvoidingView>
    )
  };

  renderLoadingView = () => {
    return (
      <View style={styles.container}>
        {this.renderHeader()}
        <View style={{justifyContent: 'center', flex:1}}>
          <ActivityIndicator size="large" color="#0000ff"/>
        </View>
      </View>
    )
  };

  renderScanningView = () => {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.barcodeContainer2}>
            <BarcodeScanner
              onBarcodeRead={this.handleBarcodeRead}
              onCancelScan={this.handleCancelScan}
            />
          </View>
        </View>
      </View>
    )
  };

  renderTakePhotoView = () => {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.barcodeContainer2}>
            <PhotoCamera
              onTakingPhoto = {this.handleTakingPhoto}
              onCancelScan = {this.handleCancelScan}
            />
          </View>
        </View>
      </View>
    )
  };

  testScroll = () => {
    this.scroll.props.scrollToPosition(0, 300)
  };

  scrollToInput = reactNode => {
    this.scroll.props.scrollToFocusedInput(reactNode)
  };

  //调用序列号扫码
  createSeq = () => {
    this.setState({
      viewMode: ViewMode.Scanning,
      scanType: ScanType.SeqNum
    });
  };
  //手动填写序列号
  handleSeqNum = async () =>{
    if(!this.state.next_seq_no.value){return};
    let seqNum = this.state.next_seq_no.value;

    this.clearData();
    this.setState({
      viewMode: ViewMode.Loading
    });

    let client = new ApiClient();
    let responseData = await client.findDataBySeqNo(seqNum);
    if(responseData.data[0].length!==0){
      if(!!responseData.data[0].f_process_secondhand){
        this.handleReturnUpdate('f_process_secondhand',responseData.data[0].f_process_secondhand);
      };
      this.setState({
          addreturn:false
      })
    }
    //console.log(this.state);
    let newProductDetails = JSON.parse(JSON.stringify(this.state.productDetails));
    let newReturnDetails = JSON.parse(JSON.stringify(this.state.returnDetails));
    let newNextSeqNo = JSON.parse(JSON.stringify(this.state.next_seq_no));
    newNextSeqNo.value = seqNum;

    let callbackDatas = responseData.data[0];
    for (let key of Object.keys(callbackDatas)) {
      if(key!=='f_receiver'){
        if(newProductDetails.hasOwnProperty(key) && !newProductDetails[key].value){
          newProductDetails[key].value = callbackDatas[key];
        } else if(newReturnDetails.hasOwnProperty(key) && !newReturnDetails[key].value) {
          newReturnDetails[key].value = callbackDatas[key];
        }else{

        }
      }
    }

    // this.clearData();
    this.setState({
      productDetails: newProductDetails,
      returnDetails: newReturnDetails,
      next_seq_no: newNextSeqNo
    });

    this.setState({
      viewMode: ViewMode.Details
    });
  };
  //序列号扫码后回调填写
  handleScanSeqNum = async (scanData) =>{
    //返回扫描结果进入loading界面
    this.setState({
      viewMode: ViewMode.Loading
    });
    this.clearData();
    //根据扫描得到条形码后调用请求
    let client = new ApiClient();
    let responseData = await client.findDataBySeqNo(scanData.data);
    if(responseData.data[0].length!==0){
      if(!!responseData.data[0].f_process_secondhand){
        this.handleReturnUpdate('f_process_secondhand',responseData.data[0].f_process_secondhand);
      };
      this.setState({
          addreturn:false
      })
    }

    let newProductDetails = JSON.parse(JSON.stringify(this.state.productDetails));
    let newReturnDetails = JSON.parse(JSON.stringify(this.state.returnDetails));
    //let newNextSeqNo = JSON.parse(JSON.stringify(this.state.next_seq_no));

    let callbackDatas = responseData.data[0];
    for (let key of Object.keys(callbackDatas)) {
      if(key!=='f_receiver'||key!=='f_create_username'||key!=='f_create_userid'&& key!=='f_lastupdate_userid'&& key!=='f_lastupdate_username'){
        if(newProductDetails.hasOwnProperty(key) && !newProductDetails[key].value){
          newProductDetails[key].value = callbackDatas[key];
        } else if(newReturnDetails.hasOwnProperty(key) && !newReturnDetails[key].value) {
          newReturnDetails[key].value = callbackDatas[key];
        }
      }
    }

    this.clearData();
    this.setState({
      productDetails: newProductDetails,
      returnDetails: newReturnDetails,
      viewMode: ViewMode.Details
    });

    //更新填写条形码
    this.updateNextSeqNo(scanData.data);
  };
  //相册选择功能
  pickPhotos = async () =>{
    await Permissions.askAsync(Permissions.CAMERA);
    let uploadimg = this.state.uploadimg;
    let newphoto = await ImagePicker.launchImageLibraryAsync({
      allowsEditing:false,
      quality:0.1
    });

    if(newphoto.cancelled!==true){
      this.setState({
        waittingupload:true,
        uploadimg: this.state.uploadimg.concat([newphoto.uri]),
        uploadimgs:true
      });
    }else{
      this.setState({
        waittingupload:false,
        uploadimg: [],
        uploadimgs:false
      });
    }

    // if(newphoto.cancelled!==true){
    //     uploadimg.concat(newphoto.uri);
    //     this.setState({
    //         waittingupload:true,
    //         uploadimg:uploadimg
    //     })
    // }
    // console.log(this.state.uploadimg);

    // if(newphoto.cancelled!==true){
    //     this.setState({
    //         waittingupload:true,
    //         //uploadimg:newphoto.uri
    //     })
    // }
  };
  //图片上传功能
  handleupload = async () =>{
    let photouri = this.state.uploadimg[0];


    let photoname = photouri.substring(photouri.lastIndexOf("\/")+ 1, photouri.length);
    let newphoto = {
      name:photoname,
      uri:photouri
    };
    let client = new ApiClient();
    this.setState({
      viewMode: ViewMode.Loading,
    });
    let responseData = await client.uploadimage(newphoto);


    if(responseData.success===true){
      this.setState({
        viewMode: ViewMode.Details,
        uploadedimg:responseData.data
      });

      this.setState({
        waittingupload:false,
        uploadimg: [],
      });
      Alert.alert(
        'Upload',
        'Upload Sccuess',
        [{text: 'OK'}],
      );
    }else{
      Alert.alert(
        'Login Failed',
        'No account or Password error',
        [{text: 'OK'}],
      );
    }
  };
  //多图上传
  handleuploads = async () =>{
    let client = new ApiClient();
    this.setState({
      viewMode: ViewMode.Loading,
    });
    let responseData = await client.uploadimages(this.state.uploadimg);
    if(responseData.success==true){
      this.setState({
        viewMode: ViewMode.Details,
        uploadedimg:responseData.data
      });
      this.setState({
        waittingupload:false,
        uploadimgs:false,
        uploadimg: [],
      });
      Alert.alert(
        'Upload',
        'Upload Sccuess',
        [{text: 'OK'}],
      );
    }else{
      Alert.alert(
        'Upload Failed',
        'Upload Failed',
        [{text: 'OK'}],
      );
    }
  };
  //扫描快递码
  startScanDeliveryTrackingNo = async () =>{
      this.setState({
          viewMode: ViewMode.Scanning,
          scanType: ScanType.DeliveryTracking
      });
  };
  startScanReturnTrackingNo = async () =>{
        this.setState({
            viewMode: ViewMode.Scanning,
            scanType: ScanType.ReturnTracking
        });
    };
  //填写快递码
  handleTextDeliveryTrackingNo = async () =>{
    let trackingNo = this.state.productDetails.f_delivery_tracking_no.value;
    if(!trackingNo)return;
    this.handleScanDeliveryTracking(trackingNo);
  };
  handleTextReturnTrackingNo = async () =>{
    let trackingNo = this.state.returnDetails.f_return_tracking_no.value;
    if(!trackingNo)return;
    this.handleScanReturnTracking(trackingNo);
  };

  handleSelectPhoto = () =>{
    this.setState({
      viewMode: ViewMode.PhotoSelect
    })
  };

  renderPhotoSelectView = () =>{
    const { uploadimg } = this.state;

    return (
      <KeyboardAwareScrollView
        style={styles.container}
        enableOnAndroid={true} extraHeight={170}
        extraScrollHeight={170} innerRef={ref => {this.scroll = ref}}
        enableResetScrollToCoords={false}>
        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'space-between'}}>
          <View style={{marginTop:200}}>

            <View>
              {!this.state.waittingupload && !this.state.uploadimgs &&
              <View style={{margin: 10, flexDirection: 'row', justifyContent: 'center'}}>
                {/*<Button title='New Album' onPress={this.handleStartTakingPhoto}/>*/}
                <TouchableHighlight
                  onPress={this.handleStartTakingPhoto}
                  style={{width: '80%', backgroundColor: '#466DC5', height: 50, borderRadius: 5}}
                >
                  <Text style={styles.buttontext}>New Album</Text>
                </TouchableHighlight>
              </View>
              }

              <View style={{margin:10,flexDirection: 'row',justifyContent:'center'}}>
                {/*<Button title='Select from the Album' style={{marginTop:20}} onPress={this.pickers}/>*/}
                <TouchableHighlight
                  onPress={this.pickPhotos}
                  style={{width:'80%',backgroundColor:'#466DC5',height: 50,borderRadius:5}}
                >
                  <Text style={styles.buttontext}>Select from the Album</Text>
                </TouchableHighlight>
              </View>

            </View>

            {/*{this.state.waittingupload &&*/}
            {/*<View style={{flexDirection: 'row',justifyContent:'center'}}>*/}
            {/*{<Image source={{ uri: uploadimg }} style={{ width: 200, height: 200 }} />}*/}
            {/*</View>*/}
            {/*}*/}
            {this.state.waittingupload &&
            this.state.uploadimg.map((item, index) => {
              return(
                <View key={index} style={{flexDirection: 'row',justifyContent:'center'}}>
                  <Image
                    source={{uri: item, width: 32, height: 32}}
                    style={{width: 200, height: 200, marginRight: 50, marginTop: 5}}
                  />
                  <Icon
                    raised
                    name='times'
                    type='font-awesome'
                    containerStyle={{marginTop: 20}}
                    onPress={() => {this.removeUploadImage(index)}}
                  />
                </View>
              )
            })
            }

            {/*<View style={{flexDirection: 'row',justifyContent:'center'}}>*/}
            {/*{this.state.waittingupload && this.state.uploadimg &&*/}
            {/*<View><Image source={{uri: uploadimg}} style={{ width: 200, height: 200 }} /></View>*/}
            {/*}*/}
            {/*{this.state.uploadimgs.map((item,index)=>{*/}
            {/*/!*<Image source={{ uri: item[index].uri}} style={{ width: 200, height: 200 }} key={item[index].name}/>*!/*/}
            {/*})}*/}
            {/*</View>*/}

            {this.state.waittingupload && !this.state.uploadimgs &&
            <View style={{margin:10,flexDirection: 'row',justifyContent:'center'}}>
              {/*<Button title='Select from the Album' style={{marginTop:20}} onPress={this.pickers}/>*/}
              <TouchableHighlight
                onPress={this.handleupload}
                style={{width:'40%',backgroundColor:'#466DC5',height: 50,borderRadius:5}}
              >
                <Text style={styles.buttontext}>Upload</Text>
              </TouchableHighlight>
            </View>
            }
            {this.state.waittingupload && this.state.uploadimgs &&
            <View style={{margin:10,flexDirection: 'row',justifyContent:'center'}}>
              {/*<Button title='Select from the Album' style={{marginTop:20}} onPress={this.pickers}/>*/}
              <TouchableHighlight
                onPress={this.handleuploads}
                style={{width:'40%',backgroundColor:'#466DC5',height: 50,borderRadius:5}}
              >
                <Text style={styles.buttontext}>Upload</Text>
              </TouchableHighlight>
            </View>
            }
          </View>

          <View style={{marginBottom:60,flexDirection: 'row',justifyContent:'center'}}>
            {/*<Button title='Cancel' onPress={() =>{this.setState({viewMode: ViewMode.Details})}}/>*/}
            <TouchableHighlight
              onPress={()=>{this.setState({
                viewMode:ViewMode.Details,
                waittingupload:false,
                uploadimg:[],
                uploadimgs:false,
              })}}
              style={{width:'80%',backgroundColor:'red',height: 50,borderRadius:5}}
            >
              <Text style={styles.buttontext}>Cancel</Text>
            </TouchableHighlight>
          </View>
        </View>
      </KeyboardAwareScrollView>
    )
  };

  removeUploadImage = (index) => {
    let images = this.state.uploadimg.filter((e, i) => i != index);
    this.setState({
      uploadimg: images
    })
  };

  renderDetailsView = () => {
    const {productDetails, returnDetails, submitMsg, images, next_seq_no} = this.state;
    let processType = returnDetails.f_process.value;

    let returnReasonItems = returnReasons.map((s, i) => {
      return {
        label: s.label,
        value: s.value
      }
    });

    let returnCourierItems = returnCouriers.map((s, i) => {
      return {
        label: s.label,
        value: s.value
      }
    });

    let asnItems = asnOptions.map((s, i) => {
      return {
        label: s,
        value: s
      }
    });

    let processTypeItems = processTypes.map((s, i) => {
      return {
        label: s.label,
        value: s.value,

      }
    });

    return(
      <KeyboardAwareScrollView
        style={styles.container}
        enableOnAndroid={true} extraHeight={170}
        extraScrollHeight={170} innerRef={ref => {this.scroll = ref}}
        enableResetScrollToCoords={false}>
        {this.renderHeader()}
        {
          !!submitMsg &&
          <View style={styles.submitMsgView}>
            <Text style={{color: 'white'}}>{this.state.submitMsg}</Text>
          </View>
        }
        <View style={styles.infoContainer}>
          <Card title='Return Details'>
            <FormLabel>{next_seq_no.label}</FormLabel>
            <View style={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center'}} >
              <TextInput
                style={[styles.textInput, {flex: 1}]}
                value ={next_seq_no.value}
                editable = {true}
                onChangeText = {(text) => {this.hanldeSeqNoUpdate(text)}}
                onBlur={(text) => this.handleSeqNum()}
                ref='1'
                onSubmitEditing={async () => {
                  await this.handleSeqNum();
                  this.focusNextField('2');
                }}
              />
              <Icon
                name={'barcode'}
                type='font-awesome'
                onPress={() => this.createSeq()}
              />
            </View>
            <FormLabel>{productDetails.f_barcode.label}</FormLabel>
            <View style={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
              <TextInput style={[styles.textInput, {flex: 1}]}
                         value={productDetails.f_barcode.value}
                         autoCorrect={false}
                         onChangeText={(text) => this.handleProductUpdate('f_barcode', text)}
                         onSubmitEditing={async () => {
                           await this.findSkuByBarcode(this.state.productDetails.f_barcode.value);
                           this.focusNextField('3');
                         }}
                         blurOnSubmit={false}
                         onFocus={(event) => {
                           this.scrollToInput(findNodeHandle(event.target))
                         }}
                         ref='2'
              />
              <Icon
                name={'search'}
                type='font-awesome'
                onPress={() => this.findSkuByBarcode(this.state.productDetails.f_barcode.value)}
              />
            </View>
            <FormLabel>{productDetails.f_sku.label}</FormLabel>
            <TextInput style={styles.textInput}
                       value={productDetails.f_sku.value}
                       autoCorrect={false}
                       onChangeText={(text) => this.handleProductUpdate('f_sku', text)}
                       blurOnSubmit={false}
                       onSubmitEditing={() => {
                         this.focusNextField('4');
                       }}
                       onFocus={(event) => {
                         this.scrollToInput(findNodeHandle(event.target))
                       }}
                       ref='3'
            />
            <FormLabel>{productDetails.f_delivery_tracking_no.label}</FormLabel>
            <View style={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
              <TextInput style={[styles.textInput, {flex: 1}]}
                         value={productDetails.f_delivery_tracking_no.value}
                         autoCorrect={false}
                         onChangeText={(text) => this.handleProductUpdate('f_delivery_tracking_no', text)}
                         onSubmitEditing={async () => {
                           await this.handleScanDeliveryTracking(productDetails.f_delivery_tracking_no.value);
                           this.focusNextField('5');
                         }}
                         blurOnSubmit={false}
                         onFocus={(event) => {
                           this.scrollToInput(findNodeHandle(event.target))
                         }}
                         //onBlur={this.handleTextDeliveryTrackingNo}
                         ref='4'
              />
              <Icon
                name={'barcode'}
                type='font-awesome'newan
                //onPress={() => this.handleScanDeliveryTracking(productDetails.f_delivery_tracking_no.value)}
                onPress={() =>{this.startScanDeliveryTrackingNo()}}
              />
            </View>
            <FormLabel>{returnDetails.f_return_tracking_no.label}</FormLabel>
            <View style={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
              <TextInput style={[styles.textInput, {flex: 1}]}
                         value={returnDetails.f_return_tracking_no.value}
                         autoCorrect={false}
                         onChangeText={(text) => this.handleReturnUpdate('f_return_tracking_no', text)}
                         onSubmitEditing={async () => {
                           //await this.loadDetails(returnDetails.f_return_tracking_no.value,2);
                           await this.handleScanReturnTracking(returnDetails.f_return_tracking_no.value);
                           this.focusNextField('6');
                         }}
                         ref='5'
                         blurOnSubmit={false}
                         onFocus={(event) => {
                           this.scrollToInput(findNodeHandle(event.target))
                           }}
                         //onBlur={this.handleTextReturnTrackingNo}
              />
              <Icon
                name={'barcode'}
                type='font-awesome'
                onPress={() => {this.startScanReturnTrackingNo()}}
              />
            </View>

            <FormLabel>{returnDetails.f_note.label}</FormLabel>
            <TextInput style={styles.textInput}
                       value={returnDetails.f_note.value}
                       autoCorrect={false}
                       onChangeText={(text) => this.handleReturnUpdate('f_note', text)}
                       ref='6'
                       returnKeyType='next'
                       blurOnSubmit={false}
              //onSubmitEditing={() => this.focusNextField('7')}
                       onFocus={(event) => {
                         this.scrollToInput(findNodeHandle(event.target))
                       }}
            />

            <FormLabel><Text>{returnDetails.f_return_reason.label}</Text></FormLabel>
            <View style={styles.pickerSelectView}>
              <RNPickerSelect
                hideIcon
                useNativeAndroidPickerStyle={false}
                placeholder={{
                  label: 'Select a return reason...',
                  value: null,
                  color: '#9EA0A4'
                }}
                items={returnReasonItems}
                value={this.state.returnDetails.f_return_reason.value}
                onValueChange={(value) => {
                  this.handleReturnUpdate('f_return_reason', value);
                }}
                ref={(el) => {
                  this.inputRefs.picker = el;
                }}
                style={{viewContainer: styles.pickerSelect}}
              />
            </View>

            <FormLabel>{returnDetails.f_process.label}</FormLabel>
            <View style={styles.pickerSelectView}>
              <RNPickerSelect
                hideIcon
                useNativeAndroidPickerStyle={false}
                placeholder={{
                  label: 'Select a process type',
                  value: null,
                  color: '#9EA0A4',
                }}
                items={processTypeItems}
                value={this.state.returnDetails.f_process.value}
                onValueChange={(value) => {
                  this.handleReturnUpdate('f_process', value);
                  //this.focusNextField('30');
                }}
                ref={(el) => {
                  this.inputRefs.picker = el;
                }}
                style={{viewContainer: styles.pickerSelect}}
              />
            </View>
            {
              processType === ProcessType.ASN &&
              <View style={styles.pickerSelectView}>
                <RNPickerSelect
                  hideIcon
                  useNativeAndroidPickerStyle={false}
                  placeholder={{
                    label: 'Select an ASN',
                    value: null,
                    color: '#9EA0A4',
                  }}
                  items={asnItems}
                  value={this.state.returnDetails.f_process_asn.value}
                  onValueChange={(value) => {
                    this.handleReturnUpdate('f_process_asn', value);
                  }}
                  ref={(el) => {
                    this.inputRefs.picker = el;
                  }}
                  style={{viewContainer: styles.pickerSelect}}
                />
              </View>
            }
            {
              processType === ProcessType.SecondHand &&
              <TextInput style={styles.textInput}
                         autoCorrect={false}
                // autoFocus={true}
                         value={this.state.returnDetails.f_process_secondhand.value}
                         onChangeText={(text) => this.handleReturnUpdate('f_process_secondhand', text)}
                         ref='22'
                         returnKeyType='next'
                         blurOnSubmit={false}
                         onSubmitEditing={() => this.focusNextField('30')}
                         onFocus={(event) => {
                           this.scrollToInput(findNodeHandle(event.target))
                         }}
              />
            }

            <FormLabel>{returnDetails.f_return_courier_name.label}</FormLabel>
            <View style={styles.pickerSelectView}>
              <RNPickerSelect
                hideIcon
                useNativeAndroidPickerStyle={false}
                placeholder={{
                  label: 'Select a return courier...',
                  value: null,
                  color: '#9EA0A4',
                }}
                items={returnCourierItems}
                value={this.state.returnDetails.f_return_courier_name.value}
                onValueChange={(value) => {
                  this.handleReturnUpdate('f_return_courier_name', value);
                }}
                ref={(el) => {
                  this.inputRefs.picker = el;
                }}
                style={{viewContainer: styles.pickerSelect}}
              />
            </View>
            <FormLabel>{returnDetails.f_receiver.label}</FormLabel>
            <TextInput style={styles.textInput}
                       value={returnDetails.f_receiver.value}
                       editable={false}
                       autoCorrect={false}
                       onChangeText={(text) => this.handleReturnUpdate('f_receiver', text)}
                       ref='30'
                       returnKeyType='next'
                       blurOnSubmit={false}
                       onSubmitEditing={() => this.focusNextField('31')}
                       onFocus={(event) => {
                         this.scrollToInput(findNodeHandle(event.target))
                       }}
            />
            <FormLabel>{returnDetails.f_ticket_no.label}</FormLabel>
            <TextInput style={styles.textInput}
                       value={returnDetails.f_ticket_no.value}
                       autoCorrect={false}
                       onChangeText={(text) => this.handleReturnUpdate('f_ticket_no', text)}
                       ref='31'
                       returnKeyType='next'
                       blurOnSubmit={false}
              //onSubmitEditing={() => this.focusNextField('32')}
                       onFocus={(event) => {
                         this.scrollToInput(findNodeHandle(event.target))
                       }}
            />

            {/*<FormLabel>{productDetails.job_no.label}</FormLabel>*/}
            {/*<TextInput style={styles.textInput}*/}
            {/*value={productDetails.job_no.value}*/}
            {/*autoCorrect={false}*/}
            {/*onChangeText={(text) => this.handleProductUpdate('job_no', text)}*/}
            {/*ref='32'*/}
            {/*returnKeyType='next'*/}
            {/*blurOnSubmit={false}*/}
            {/*onSubmitEditing={() => this.focusNextField('33')}*/}
            {/*onFocus={(event) => {*/}
            {/*this.scrollToInput(findNodeHandle(event.target))*/}
            {/*}}*/}
            {/*/>*/}
            {/*<FormLabel>{productDetails.unit_cost.label}</FormLabel>*/}
            {/*<TextInput style={styles.textInput}*/}
            {/*value={productDetails.unit_cost.value.toString()}*/}
            {/*autoCorrect={false}*/}
            {/*keyboardType = 'numeric'*/}
            {/*onChangeText={(text) => this.handleProductUpdate('unit_cost', text)}*/}
            {/*ref='33'*/}
            {/*returnKeyType='next'*/}
            {/*blurOnSubmit={false}*/}
            {/*onSubmitEditing={() => this.focusNextField('34')}*/}
            {/*onFocus={(event) => {*/}
            {/*this.scrollToInput(findNodeHandle(event.target))*/}
            {/*}}*/}
            {/*/>*/}
            {/*<FormLabel>{returnDetails.result.label}</FormLabel>*/}
            {/*<TextInput style={styles.textInput}*/}
            {/*autoCorrect={false}*/}
            {/*value={returnDetails.result.value}*/}
            {/*onChangeText={(text) => this.handleReturnUpdate('result', text)}*/}
            {/*ref='34'*/}
            {/*returnKeyType='next'*/}
            {/*blurOnSubmit={false}*/}
            {/*onSubmitEditing={() => this.focusNextField('35')}*/}
            {/*onFocus={(event) => {*/}
            {/*this.scrollToInput(findNodeHandle(event.target))*/}
            {/*}}*/}
            {/*/>*/}
            {/*<FormLabel>{productDetails.post_est.label}</FormLabel>*/}
            {/*<TextInput style={styles.textInput}*/}
            {/*autoCorrect={false}*/}
            {/*keyboardType = 'numeric'*/}
            {/*value={productDetails.post_est.value.toString()}*/}
            {/*onChangeText={(text) => this.handleProductUpdate('post_est', text)}*/}
            {/*ref='35'*/}
            {/*/>*/}
            <View style={{margin:10,flexDirection: 'row',justifyContent:'center'}}>
              {/*<Button title='UpLoadImage' style={{justifyContent: 'center',alignItems: 'center',backgroundColor:'red'}}*/}
              {/*onPress={this.handleSelectPhoto}></Button>*/}
              <TouchableHighlight
                onPress={()=>{this.handleSelectPhoto()}}
                style={{width:'80%',backgroundColor:'#466DC5',height: 50,borderRadius:5}}
              >
                <Text style={styles.buttontext}>Upload Image</Text>
              </TouchableHighlight>
            </View>
          </Card>
          {/*<Card title='Images'>*/}
          {/*<Button title='Select' onPress={this.pickImage}></Button>*/}
          {/*<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>*/}
          {/*{*/}
          {/*images.map((item, index) => {*/}
          {/*return (*/}
          {/*<View key={index} style={{flex: 1, flexDirection: 'row'}}>*/}
          {/*<Image*/}
          {/*source={{uri: item, width: 32, height: 32}}*/}
          {/*style={{width: 100, height: 100, marginRight: 50, marginTop: 5}}*/}
          {/*/>*/}
          {/*<Icon*/}
          {/*raised*/}
          {/*name='times'*/}
          {/*type='font-awesome'*/}
          {/*containerStyle={{marginTop: 20}}*/}
          {/*onPress={() => {this.removeImage(index)}}*/}
          {/*/>*/}
          {/*</View>*/}
          {/*)*/}
          {/*})*/}
          {/*}*/}
          {/*</View>*/}
          {/*</Card>*/}
          <View style={styles.submitButtonView}>
            {/*<Button title='Clear Data' onPress={this.handleClearData}></Button>*/}
            {/*<Button title='Submit Data' onPress={this.handleSubmit}></Button>*/}
            <TouchableHighlight
              onPress={()=>{this.handleClearData()}}
              style={{width:'30%',backgroundColor:'red',height: 50,borderRadius:5,marginLeft:15}}
            >
              <Text style={styles.buttontext}>Clear Data</Text>
            </TouchableHighlight>
            <TouchableHighlight
              onPress={()=>{this.handleSubmit()}}
              style={{width:'30%',backgroundColor:'#466DC5',height: 50,borderRadius:5,marginRight:15}}
            >
              <Text style={styles.buttontext}>Submit Data</Text>
            </TouchableHighlight>
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
  };

  renderHomeView = () => {
    const {showStatus, submitStatus, submitMsg, errorStatus, errorMsg} = this.state;

    return (
      <View style={styles.container}>
        {this.renderHeader()}
        <View style={{flex:1, alignItems: 'center', justifyContent: 'center'}}>
          {showStatus &&
          <View style={{alignItems: 'center'}}>
            <Icon
              raised
              name={submitStatus ? 'check' : 'times'}
              type='font-awesome'
              color={submitStatus ? '#517fa4': 'red'}
            />
            <Text style={{alignItems: 'center'}}>{submitMsg}</Text>
          </View>
          }
          {errorStatus &&
          <View style={{alignItems: 'center'}}>
            <Icon
              raised
              name='times'
              type='font-awesome'
              color='red'
            />
            <Text style={{alignItems: 'center', margin:15}}>{errorMsg}</Text>
          </View>
          }
        </View>
        <View style={styles.buttonViewContainer}>
          <Button title='Scan Tracking No' onPress={this.handleStartTrackingScan}></Button>
          <Button title='Enter Tracking No' onPress={this.handleEnterBarcode}></Button>
          <Button title='Test' onPress={this.test}></Button>
        </View>
        <View style={{flex:1}}></View>
      </View>
    );
  };

  renderEnterBarcodeView(){
    let promptValue = '';
    return(
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        {this.renderHeader()}
        <View style={{flex:1, justifyContent: 'center'}}>
          <Card title='Enter Tracking No'>
            <Text>{this.state.errorMsg}</Text>
            <TextInput style={styles.textInput}
                       autoFocus={true}
                       autoCorrect={false}
                       onChangeText={(text) => {promptValue = text}}
            />
            <View style={styles.submitButtonView}>
              <Button title='Cancel' onPress={this.handleEnterBarcodeCancel}></Button>
              <Button title='Submit' onPress={() =>this.handleEnterBarcodeSubmit(promptValue)}></Button>
            </View>
          </Card>
        </View>
      </KeyboardAvoidingView>
    )
  }

  render(){
    const {viewMode} = this.state;

    if(viewMode == ViewMode.Login) {
      return this.renderLoginView();
    } else if(viewMode === ViewMode.Loading){
      return this.renderLoadingView();
    } else if(viewMode === ViewMode.Scanning){
      return this.renderScanningView();
    } else if(viewMode === ViewMode.Details){
      return this.renderDetailsView();
    } else if(viewMode === ViewMode.EnterBarcode){
      return this.renderEnterBarcodeView();
    } else if(viewMode === ViewMode.TakePhoto){
      return this.renderTakePhotoView();
    }else if(viewMode === ViewMode.PhotoSelect){
      return this.renderPhotoSelectView();
    }else{
      return this.renderHomeView();
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF'
  },
  buttonViewContainer: {
    flex:1,
    // flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 130
    // height: 100
    // justifyContent: 'space-around',
    // backgroundColor: 'blue'
  },
  contentContainer: {
    // flexGrow: 1,
    flex: 1,
    justifyContent: 'center',
    // backgroundColor: 'blue'
    // alignItems: 'center'
  },
  barcodeContainer1: {
    // flex: 1,
    // backgroundColor: 'green',
    justifyContent: 'center',
    margin: 5
  },
  barcodeContainer2: {
    flex: 1,
    justifyContent: 'center',
    // backgroundColor: 'green'
  },
  errorContainer: {
    backgroundColor: 'red'
  },
  infoContainer: {
    flex: 1,
    marginBottom: 20,
    // backgroundColor: 'red'
  },
  submitButtonView: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInput: {
    marginLeft:20,
    paddingLeft: 0,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgrey'
  },
  pickerSelectView: {
    marginLeft: 17,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgrey'
  },
  pickerSelect: {
    flex:1,
    // backgroundColor: 'purple',
    paddingTop: 12,
    paddingBottom: 12
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  submitMsgView: {
    flex: 1,
    backgroundColor: 'green',
  },

  buttontext: {
    color:'#fff',
    textAlign:'center',
    lineHeight:50,
    fontSize: 16,
  }
});
