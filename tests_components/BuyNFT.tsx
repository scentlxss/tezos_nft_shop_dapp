import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import { ToastContainer, toast } from 'react-toastify';

interface BuyNFTProps {
  contract: WalletContract | any;
  setUserBalance: Dispatch<SetStateAction<any>>;
  Tezos: TezosToolkit;
  userAddress: string;
  setStorage: Dispatch<SetStateAction<any>>;
  setNftList: Dispatch<SetStateAction<any>>;
  nftList: any;
}

const BuyNFT = ({ contract, setUserBalance, Tezos, userAddress, setStorage, setNftList, nftList }: BuyNFTProps) => {
  const [loadingBuy, setLoadingBuy] = useState<boolean>(false);
  const [id, setId] = useState<number>();
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const toastId: any = React.useRef(null);



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

  const buy_nft = async (): Promise<void> => {
      setLoadingBuy(true);
      setTransactionInProgress(true);
      try {
        const op = await contract.methods.buy(id).send(
          {
            amount: nftList[id].price
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
        console.log(error);
        toast.error(
          'There was an error sending your transaction. Please check developer console.'
        );
      } finally {
        setLoadingBuy(false);
        setTransactionInProgress(false);
      }

  };


  if (!contract && !userAddress) return <div>&nbsp;</div>;
  return (
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
        value={id}
        onChange={e => setId(parseInt(e.target.value,10))}
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
    <ToastContainer />
    </div>
  );
};

export default BuyNFT;
