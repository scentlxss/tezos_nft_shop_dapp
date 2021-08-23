import React, { useState, useEffect } from "react";
import { TezosToolkit } from "@taquito/taquito";
import { ToastContainer, toast } from 'react-toastify';
import "./App.css";
import ConnectButton from "./components/ConnectWallet";
import DisconnectButton from "./components/DisconnectWallet";
import qrcode from "qrcode-generator";
import { DataGrid, GridColDef, GridValueGetterParams } from '@material-ui/data-grid';
import 'react-toastify/dist/ReactToastify.css';




const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 300 },
  {
    field: 'stock',
    headerName: 'Stock',
    width: 400,
  },
  {
    field: 'price',
    headerName: 'Price',
    width: 400,

  },
  {
    field: 'address',
    headerName: 'NFT address',
    width: 800,
  },
  {
    field: 'admin',
    headerName: 'admin',
    width: 800

  }
];

enum BeaconConnection {
  NONE = "",
  LISTENING = "Listening to P2P channel",
  CONNECTED = "Channel connected",
  PERMISSION_REQUEST_SENT = "Permission request sent, waiting for response",
  PERMISSION_REQUEST_SUCCESS = "Wallet is connected"
}

const App = () => {
  const [Tezos, setTezos] = useState<TezosToolkit>(
    new TezosToolkit("https://florencenet.api.tez.ie")
  );
  const [contract, setContract] = useState<any>(undefined);
  const [publicToken, setPublicToken] = useState<string | null>("");
  const [wallet, setWallet] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [userBalance, setUserBalance] = useState<any>(0);
  const [storage, setStorage] = useState<any>();
  const [copiedPublicToken, setCopiedPublicToken] = useState<boolean>(false);
  const [beaconConnection, setBeaconConnection] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("buy");
  const [nftList, setNftList] = useState<any[]>();
  const [buyId, setBuyId] = useState<number>();
  const [recoverId, setRecoverId] = useState<number>();
  const [loadingBuy, setLoadingBuy] = useState<boolean>(false);
  const [loadingRecover, setLoadingRecover] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const toastId: any = React.useRef(null);

  // Florencenet contract
  const contractAddress: string = "KT1T5r6Wh44BVfXXcDH9FXq6oCXdzt8b7AqW";

  const generateQrCode = (): { __html: string } => {
    const qr = qrcode(0, "L");
    qr.addData(publicToken || "");
    qr.make();

    return { __html: qr.createImgTag(4) };
  };

  useEffect(() => {
      if (transactionInProgress && !toastId.current) {
          toastId.current = toast.info(
              'Transaction in progress. Confirm signing dialog and please wait...',
              {
                  position: 'top-right',
                  autoClose: false,
                  hideProgressBar: false,
                  closeOnClick: false,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  closeButton: false
              }
          );
      } else if (!transactionInProgress && toastId.current) {
          toast.dismiss(toastId.current);
          toastId.current = null;
      }
  }, [transactionInProgress, toastId.current]);

  async function buy_nft(){

      if (typeof buyId !== 'undefined' && typeof nftList !== 'undefined'){

        setLoadingBuy(true);
        setTransactionInProgress(true);
        
        try {
          const op = await contract.methods.buy(buyId).send(
            {
              amount: nftList[buyId].price
            });

          await op.confirmation();
          const newStorage: any = await contract.storage();
          if (newStorage) setStorage(newStorage);
          let newNftList: any = [];
          newStorage.forEach( (value: any, key: number, idx: any) => {
            newNftList.push({id: key, stock:value.current_stock.toNumber(), price:value.token_price.toNumber() /1000000, address:value.token_address, admin: value.token_admin});
          });
          setNftList(newNftList);
          setUserBalance(await Tezos.tz.getBalance(userAddress));
          toast("Successfully bought nft", {type:'success'});
        } catch (error) {
          console.error(error);
          toast.error(
            'There was an error sending your transaction. Please check developer console.'
          );
        } finally {
          setLoadingBuy(false);
          setTransactionInProgress(false);
        }
      }
  }

  async function recover_nft(){

      if (typeof recoverId !== 'undefined'){

        setLoadingRecover(true);
        setTransactionInProgress(true);

        try {
          const op = await contract.methods.recover(recoverId).send();

          await op.confirmation();
          const newStorage: any = await contract.storage();
          if (newStorage) setStorage(newStorage);
          let newNftList: any = [];
          newStorage.forEach( (value: any, key: number, idx: any) => {
            newNftList.push({id: key, stock:value.current_stock.toNumber(), price:value.token_price.toNumber() /1000000, address:value.token_address, admin: value.token_admin});
          });
          setNftList(newNftList);
          setUserBalance(await Tezos.tz.getBalance(userAddress));
          toast("Successfully recovered your nft", {type:"success"});
        } catch (error) {
          console.error(error);
          toast.error(
            'There was an error sending your transaction. Please check developer console.'
          );
        } finally {
          setTransactionInProgress(false);
          setLoadingRecover(false);
        }
      }


  }

  if (publicToken && (!userAddress || isNaN(userBalance))) {
    return (
      <div>
        <h1>Buy my NFTs on Tezos</h1>
        <div id="dialog">
          <header>Welcome to this NFT DApp</header>
          <div id="content">
            <p className="text-align-cent0er">
              <i className="fas fa-broadcast-tower"></i>&nbsp; Connecting to
              your wallet
            </p>


            <div
              dangerouslySetInnerHTML={generateQrCode()}
              className="text-align-center"
            ></div>


            <p id="public-token">
              {copiedPublicToken ? (
                <span id="public-token-copy__copied">
                  <i className="far fa-thumbs-up"></i>
                </span>
              ) : (
                <span
                  id="public-token-copy"
                  onClick={() => {
                    if (publicToken) {
                      navigator.clipboard.writeText(publicToken);
                      setCopiedPublicToken(true);
                      setTimeout(() => setCopiedPublicToken(false), 2000);
                    }
                  }}
                >
                  <i className="far fa-copy"></i>
                </span>
              )}

              <span>
                Public token: <span>{publicToken}</span>
              </span>
            </p>



            <p className="text-align-center">
              Status: {beaconConnection ? "Connected" : "Disconnected"}
            </p>
          </div>
        </div>
        <div id="footer">
          <img src="built-with-taquito.png" alt="Built with Taquito" />
        </div>
        <ToastContainer />
      </div>
    );
  } else if (userAddress && !isNaN(userBalance)) {
    return (
      <div>
        <h1>Buy my NFTs on Tezos</h1>




        {nftList ? (
          <div style={{height:400, width: '100%'}}>

          <DataGrid
            rows={nftList}
            columns={columns}
            pageSize={100}
          />
          </div>
        ) : (
        <span>Loading...</span>
        )} 


        
        <div>

        <div>
          &nbsp;
           <br/>
           <br/>
           <br/>
          &nbsp;<span> Enter Nft ID to buy </span>
           <br/>
           <br/>
          &nbsp;<input
            type="number"
            placeholder="NFT ID"
            value={buyId}
            onChange={e => setBuyId(parseInt(e.target.value,10))}
          />
          &nbsp;<button 
            className="button" 
            onClick={buy_nft}
          >
            {loadingBuy ? (
              <span>
                <i className="fas fa-spinner fa-spin"></i>&nbsp; Please wait
              </span>
            ) : (
              <span>
                <i className="fas fa-plus"></i>&nbsp; Buy NFT
              </span>
            )}
          </button>
        </div>

        <div>
          &nbsp;
           <br/>
           <br/>
           <br/>
          &nbsp;<span> Enter Nft ID to recover </span>
           <br/>
           <br/>
          &nbsp;<input
            type="number"
            placeholder="NFT ID"
            value={recoverId}
            onChange={e => setRecoverId(parseInt(e.target.value,10))}
          />
          &nbsp;<button 
            className="button" 
            onClick={recover_nft}
          >
            {loadingRecover ? (
              <span>
                <i className="fas fa-spinner fa-spin"></i>&nbsp; Please wait
              </span>
            ) : (
              <span>
                <i className="fas fa-plus"></i>&nbsp; Recover NFT
              </span>
            )}
          </button>

        </div>
      </div>

            <p>
              &nbsp;<i className="far fa-file-code"></i>&nbsp;
              <a
                href={`https://better-call.dev/florencenet/${contractAddress}/operations`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {contractAddress}
              </a>
            </p>

            <p>
              &nbsp;<i className="far fa-address-card"></i>&nbsp; {userAddress}
            </p>

            <p>
              &nbsp;<i className="fas fa-piggy-bank"></i>&nbsp;
              {(userBalance / 1000000).toLocaleString("en-US")} ꜩ
            </p>


          <DisconnectButton
            wallet={wallet}
            setPublicToken={setPublicToken}
            setUserAddress={setUserAddress}
            setUserBalance={setUserBalance}
            setWallet={setWallet}
            setTezos={setTezos}
            setBeaconConnection={setBeaconConnection}
          />

        <div id="footer">
          <img src="built-with-taquito.png" alt="Built with Taquito" />
        </div>
        <ToastContainer />
      </div>
    );

  } else if (!publicToken && !userAddress && !userBalance) {
    return (
      <div>
        <div className="title">
          <h1>Buy my NFTs on Tezos</h1>
          <a href="https://app.netlify.com/start/deploy?repository=https://github.com/ecadlabs/taquito-boilerplate">
            <img
              src="https://www.netlify.com/img/deploy/button.svg"
              alt="netlify-button"
            />
          </a>
        </div>
        <div id="dialog">
          <header>Welcome to this NFT DApp</header>
          <div id="content">
            <p>Hello!</p>
            <p>Go forth and Tezos!</p>
          </div>
          <ConnectButton
            Tezos={Tezos}
            setContract={setContract}
            setPublicToken={setPublicToken}
            setWallet={setWallet}
            setUserAddress={setUserAddress}
            setUserBalance={setUserBalance}
            setStorage={setStorage}
            setNftList={setNftList}
            contractAddress={contractAddress}
            setBeaconConnection={setBeaconConnection}
            wallet={wallet}
          />
        </div>
        <div id="footer">
          <img src="built-with-taquito.png" alt="Built with Taquito" />
        </div>
        <ToastContainer />
      </div>
    );
  } else {
    return <div>An error has occurred</div>;
  }
};

export default App;
