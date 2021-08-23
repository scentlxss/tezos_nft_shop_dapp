import React, { Component } from 'react';
import { DataGrid } from '@material-ui/data-grid';

const columns = [
  { field: 'id', headerName: 'ID', width: 200 },
  {
    field: 'stock',
    headerName: 'Stock',
    width: 300,
  },
  {
    field: 'price',
    headerName: 'Price',
    width: 300,

  },
  {
    field: 'address',
    headerName: 'NFT address',
    width: 500,
  },
];

interface nft_list_props {
  list: Object[];
}

class NFT_List extends Component<nft_list_props,nft_list_props>{

    constructor(props: nft_list_props) {
        super(props);
        this.state = {
          list: props.list
        };
    }

    render() {
        return (
          <DataGrid
            rows={this.props.list}
            columns={columns}
            pageSize={100}

          />
        );

    }
}

export default NFT_List; 