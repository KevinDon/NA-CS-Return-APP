import React from 'react';
import { Text, View, Dimensions,TouchableOpacity,Image } from 'react-native';
import { Camera, Permissions,ImageManipulator,Asset  } from 'expo';
import {Icon} from 'react-native-elements';

export default class PhotoCamera extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      barcode: '',
      errorMsg: '',
      hasCameraPermission: null,
      image:null,
      ready:false
    };
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);       //查询照相机权限
    this.setState({ permissionsGranted: status === 'granted' });

    const image = Asset.fromModule(require('../assets/splash.png'));
    await image.downloadAsync();

  }

  returnImage =(uri) =>{
      // return(
      //     <Image
      //       source={}
      //       style={{width:60,height: 45}}
      //     />
      // )
  };

  handleCancelScan = () => {
    const {onCancelScan} = this.props;
    onCancelScan();
  };

  handleTakingPhoto = async () =>{
      const {onTakingPhoto} = this.props;
      await onTakingPhoto(this);
  };

  render(){
    const {barcode, errorMsg, hasCameraPermission} = this.state;

    return (
      <View style={styles.scanViewContainer}>
        <Camera
          ref={ref => {
            this.camera = ref;
          }}
          captureAudio={false}
          style={styles.preview}
          type={Camera.Constants.Type.back}
          flashMode={Camera.Constants.FlashMode.on}
          permissionDialogTitle={'Permission to use camera'}
          permissionDialogMessage={'We need your permission to use your phone camera'}
          >
          {/*<View flexDirection='row'>*/}
            {/*<Icon*/}
              {/*raised*/}
              {/*name='remove'*/}
              {/*type='font-awesome'*/}
              {/*containerStyle={{marginTop: 30}}*/}
              {/*onPress={this.handleCancelScan}/>*/}
            {/*{!!errorMsg && <Text style={{backgroundColor: 'red', flex: 1, marginTop: 25}}>{errorMsg}</Text>}*/}
          {/*</View>*/}
            {/*<TouchableOpacity>*/}
                {/*<Icon*/}
                {/*raised*/}
                {/*name='camera'*/}
                {/*type='font-awesome'*/}
                {/*containerStyle={{marginTop: 30}}*/}
                {/*onPress={this.handleTakingPhoto}*/}
              {/*/>*/}
            {/*</TouchableOpacity>*/}
        </Camera>
        <View style={styles.toolbar}>
            <View flexDirection='row'>
                <Icon
                    raised
                    name='remove'
                    type='font-awesome'
                    //containerStyle={{marginTop: 30}}
                    onPress={this.handleCancelScan}/>
                {!!errorMsg && <Text style={{backgroundColor: 'red', flex: 1, marginTop: 25}}>{errorMsg}</Text>}
            </View>
            <TouchableOpacity>
                <Icon
                    raised
                    name='camera'
                    type='font-awesome'
                    onPress={this.handleTakingPhoto}
                />
            </TouchableOpacity>
        </View>
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
  },
  toolbar:{
    height:70,
    flexDirection:'row',
    justifyContent:'space-evenly',
      //backgroundColor:'yellow'
  },
  green:{
    backgroundColor:'green'
  }
};
