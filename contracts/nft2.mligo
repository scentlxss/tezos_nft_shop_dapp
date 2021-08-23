
type token_supply = { current_stock: nat; token_address: address; token_price: tez; token_admin: address}
type storage = (nat, token_supply) map
type return = operation list * storage
type tokenid = nat
type transfer_destination =
    [@layout:comb]
    {
    to_ : address;
    token_id : tokenid;
    amount : nat;
    }
 
type transfer =
    [@layout:comb]
    {
    from_ : address;
    txs : transfer_destination list;
    }

type parameter =
        | Buy of tokenid
        | Recover of tokenid 
        | Nothing

let update_item(tokenid,token_kind,storage:tokenid*token_supply*storage): storage =

  if (token_kind.current_stock = 1n) then 
    let storage: storage = Map.remove tokenid storage 
    in
    storage
  else 
    let storage: storage = Map.update
        tokenid
        (Some { current_stock = abs(token_kind.current_stock - 1n); token_address = token_kind.token_address; token_price = token_kind.token_price*2n; token_admin = token_kind.token_admin })
        storage 
    in
    storage


let buy(tokenid,storage:tokenid*storage): return =

  let token_kind : token_supply =
    match Map.find_opt (tokenid) storage with
    | Some k -> k
    | None -> (failwith "Unknown kind of token" : token_supply)
 
  in
  let () = if Tezos.amount <> token_kind.token_price then
    failwith "Sorry, the token you are trying to purchase has a different price"
  in
  
  let tr : transfer = {
    from_ = Tezos.self_address;
    txs = [ {
      to_ = Tezos.sender;
      token_id = abs (token_kind.current_stock - 1n);
      amount = 1n;
    } ];
  } 
  in

  let entrypoint : transfer list contract = 
    match ( Tezos.get_entrypoint_opt "%transfer" token_kind.token_address : transfer list contract option ) with
    | None -> ( failwith "Invalid external token contract" : transfer list contract )
    | Some e -> e
  in
 
  let fa2_operation : operation =
    Tezos.transaction [tr] 0mutez entrypoint
  in

  let receiver : unit contract =
    match (Tezos.get_contract_opt token_kind.token_admin : unit contract option) with
    | Some (contract) -> contract
    | None -> (failwith ("Not a contract") : (unit contract))
  in
 
  let payout_operation : operation = 
    Tezos.transaction unit amount receiver 
  in

  let storage: storage = update_item(tokenid,token_kind,storage)
  
  in
   ([fa2_operation ; payout_operation], storage)







let recover(tokenid,storage:tokenid*storage): return =
  let token_kind : token_supply =
    match Map.find_opt (tokenid) storage with
    | Some k -> k
    | None -> (failwith "Unknown kind of token" : token_supply)
 
  in
  let () = if (token_kind.token_admin <> Tezos.sender) then
    failwith "Only the admin"
  in

  let tr : transfer = {
    from_ = Tezos.self_address;
    txs = [ {
      to_ = Tezos.sender;
      token_id = abs (token_kind.current_stock - 1n);
      amount = 1n;
    } ];
  }
  in

  let entrypoint : transfer list contract = 
    match ( Tezos.get_entrypoint_opt "%transfer" token_kind.token_address : transfer list contract option ) with
    | None -> ( failwith "Invalid external token contract" : transfer list contract )
    | Some e -> e
  in
 
  let fa2_operation : operation =
    Tezos.transaction [tr] 0mutez entrypoint
  
  in

  let storage: storage = update_item(tokenid,token_kind,storage)

  in
   ([fa2_operation], storage)


let main(action,storage:parameter*storage): return = 
   match (action) with
  | Buy(tokenid) -> buy(tokenid,storage)
  | Recover(tokenid) -> recover(tokenid,storage)
  | Nothing -> (([]:operation list),storage)

 
