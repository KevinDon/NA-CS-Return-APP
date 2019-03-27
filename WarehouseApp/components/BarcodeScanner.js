import React from 'react';
import { Text, View, Dimensions } from 'react-native';
import { Camera,BarCodeScanner, Permissions } from 'expo';
import {Icon} from 'react-native-elements';

export default class BarcodeScanner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      barcode: '',
      errorMsg: '',
      hasCameraPermission: null
    };
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ permissionsGranted: status === 'granted' });
  }

  handleBarcodeRead = async (result) => {
    const {onBarcodeRead} = this.props;
    await onBarcodeRead(result);
  };

  handleBarcodeRead2 = async (result) => {
    const {onBarcodeRead} = this.props;
    let trackingNo = this.parseScanData(result);
    if(!trackingNo) {
      this.setState({
        errorMsg: 'Failed to read tracking no from code'
      });
      return;
    }

    this.setState({
      barcode: trackingNo,
      errorMsg: ''
    });

    await onBarcodeRead(trackingNo);
  };

  handleCancelScan = () => {
    const {onCancelScan} = this.props;
    onCancelScan();
  };

  render(){
    const {barcode, errorMsg, hasCameraPermission} = this.state;
    // const barcodeTypes = [
    //   RNCamera.Constants.BarCodeType.aztec,
    //   RNCamera.Constants.BarCodeType.code128,
    //   RNCamera.Constants.BarCodeType.code39,
    //   RNCamera.Constants.BarCodeType.code39mod43,
    //   RNCamera.Constants.BarCodeType.code93,
    //   RNCamera.Constants.BarCodeType.ean13,
    //   RNCamera.Constants.BarCodeType.ean8,
    //   RNCamera.Constants.BarCodeType.pdf417,
    //   RNCamera.Constants.BarCodeType.upce,
    //   RNCamera.Constants.BarCodeType.interleaved2of5,
    //   RNCamera.Constants.BarCodeType.itf14
    // ];

    return (
      <View style={styles.scanViewContainer}>
        <Camera
          ref={ref => {
            this.camera = ref;
          }}
          // barCodeTypes={barcodeTypes}
          // barCodeScannerSettings={{
          //   barCodeTypes: [
          //     BarCodeScanner.Constants.BarCodeType.aztec,
          //     BarCodeScanner.Constants.BarCodeType.code128,
          //     BarCodeScanner.Constants.BarCodeType.code39,
          //     BarCodeScanner.Constants.BarCodeType.code39mod43,
          //     BarCodeScanner.Constants.BarCodeType.code93,
          //     BarCodeScanner.Constants.BarCodeType.ean13,
          //     BarCodeScanner.Constants.BarCodeType.ean8,
          //     BarCodeScanner.Constants.BarCodeType.pdf417,
          //     BarCodeScanner.Constants.BarCodeType.upce,
          //     BarCodeScanner.Constants.BarCodeType.interleaved2of5,
          //     BarCodeScanner.Constants.BarCodeType.itf14
          //   ]
          // }}
          captureAudio={false}
          style={styles.preview}
          type={Camera.Constants.Type.back}
          flashMode={Camera.Constants.FlashMode.on}
          permissionDialogTitle={'Permission to use camera'}
          permissionDialogMessage={'We need your permission to use your phone camera'}
          onBarCodeScanned={this.handleBarcodeRead}>
          <View flexDirection='row'>
            <Icon
              raised
              name='remove'
              type='font-awesome'
              containerStyle={{marginTop: 30}}
              onPress={this.handleCancelScan}/>
            {!!errorMsg && <Text style={{backgroundColor: 'red', flex: 1, marginTop: 25}}>{errorMsg}</Text>}
          </View>
        </Camera>
      </View>
    )
  }
}

const styles = {
  scanViewContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',

  },
  preview: {
    flex: 1,
    // justifyContent: 'flex-end',
    // alignItems: 'center',
  }
};
