import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css'
import ReturnGrid from "./ReturnGrid";
import {apiServer} from './config'
import json2xls from 'json2xls';

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      rows: [],
      width: 0,
      height: 0
    };
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions() {
    this.setState({ width: window.innerWidth, height: window.innerHeight - 35 });
  }

  componentDidMount = async () => {
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);

    let url = apiServer + `/csreturn/getAllReturn`;
    let response = await fetch(url);
    let data = await response.json();
    this.setState({
      rows: data
    })
  };

  render() {
    const {rows, height} = this.state;
    let download = apiServer + '/csreturn/download';
    return (
      <div>
        <a href={download} target="_blank" style={{marginBottom:5}} className="btn btn-primary btn-sm active" role="button" aria-pressed="true">Download</a>
      {rows.length > 0 && <ReturnGrid rows={rows} height={height}/>}
      </div>
    );
  }
}

export default App;
