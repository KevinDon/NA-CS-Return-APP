import React, { Component } from 'react';
import ReactDataGrid from "react-data-grid";
import {apiServer} from './config'

const columns = [
  { key: "seq_no", name: "Seq.", editable: false, frozen: true, width: 115 },
  { key: "date", name: "Date", editable: false, resizable: true, width: 163},
  { key: "return_reason", name: "Return Reason", editable: true, resizable: true },
  { key: "barcode", name: "Barcode", editable: true, resizable: true},
  { key: "delivery_tracking_no", name: "Delivery Tracking", editable: true, resizable: true},
  { key: "return_tracking_no", name: "Return Tracking", editable: true, resizable: true },
  { key: "note", name: "Note", editable: true, resizable: true },
  { key: "sku", name: "SKU", editable: true, resizable: true },
  { key: "return_courier_name", name: "Return Courier", editable: true, resizable: true },
  { key: "user", name: "Receiver", editable: true, resizable: true},
  { key: "ticket_no", name: "Ticket No", editable: true, resizable: true },
  { key: "job_no", name: "Job No", editable: true, resizable: true },
  { key: "unit_cost", name: "Unit Cost", editable: true, resizable: true },
  { key: "process_asn", name: "ASN", editable: true, resizable: true },
  { key: "process_secondhand", name: "Secondhand", editable: true, resizable: true },
  { key: "process_type", name: "Process Type", editable: true, resizable: true },
  // { key: "result", name: "Result", editable: true, resizable: true },
  { key: "post_est", name: "Post Est.", editable: true, resizable: true},
  { key: "order_no", name: "OMS Order No", editable: true, resizable: true },
  { key: "customer_order_no", name: "Customer Order No", editable: true, resizable: true},
  { key: "order_user_nick", name: "User Id", editable: true, resizable: true },
  { key: "update_salemessage", name: "Update Salemessage", editable: true, resizable: true }
];

export default class ReturnGrid extends Component {
  constructor(props){
    super(props);
    this.state = {
      rows: []
    };
  }

  updateServer = async (fromRow, updated) => {
    const {rows} = this.state;
    let row = rows[fromRow];
    updated["seq_no"] = row.seq_no;
    console.log('update server ' + JSON.stringify(updated));
    const url = apiServer + '/csreturn/updateReturn';
    fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updated)
    });
  };

  onGridRowsUpdated = async ({ fromRow, toRow, updated }) => {
    const {rows} = this.state;
    let row = rows[fromRow];
    let keys = Object.keys(updated);
    let changed = false;
    for(let key of keys){
      if(row[key] === updated[key]) continue;
      changed = true;
    }

    if(changed === false) return;
    let newData = JSON.parse(JSON.stringify(this.state.rows));
    newData[fromRow] = {...row, ...updated};
    this.setState({
      rows: newData
    });

    await this.updateServer(fromRow, updated);
  };

  onGridRowsUpdated1 = ({ fromRow, toRow, updated }) => {
    this.setState(state => {
      const rows = state.rows.slice();
      for (let i = fromRow; i <= toRow; i++) {
        rows[i] = { ...rows[i], ...updated };
      }
      return { rows };
    });
  };

  componentDidMount() {
    const {rows} = this.props;
    this.setState({
      rows: rows
    });
  }

  render() {
    const {height} = this.props;
    const {rows} = this.state;

    return (
      <div>
        {rows.length > 0 &&
        <ReactDataGrid
          columns={columns}
          rowGetter={i => rows[i]}
          rowsCount={rows.length}
          onGridRowsUpdated={this.onGridRowsUpdated}
          enableCellSelect={true}
          minColumnWidth={80}
          minHeight={height}
        />
        }
      </div>
    );
  }
}