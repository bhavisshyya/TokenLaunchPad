import React from 'react'
import "./tokenLaunch.css"
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import {createInitializeMint2Instruction, getMinimumBalanceForRentExemptAccount, MINT_SIZE, TOKEN_PROGRAM_ID} from "@solana/spl-token";

function TokenLaunch() {
  const {connection} = useConnection();
  const wallet = useWallet();

  const createToken = async()=>{
    // to create a new mint account, you first create a key-pair for this new mint
    // acc -> owner
    if(!wallet.publicKey){
      console.log("add wallet firsts")
        return; 
    }
    try{
      const mintKeyPair = Keypair.generate();
      const lamports = await getMinimumBalanceForRentExemptAccount(connection); //get min Lamports for rent excemption on a token mint

      const balBefore = await connection.getBalance(wallet.publicKey);
      if (balBefore < lamports) {
        console.error("Insufficient funds. Please ensure you have enough SOL to create the token.");
        return;
      }
      console.log(balBefore);
          // Creating acc with some space on it, need to be signed
      const transaction = new Transaction().add(
        // intruction 1st ->create Account with mint_size data
          SystemProgram.createAccount({
              fromPubkey: wallet.publicKey,
              newAccountPubkey:mintKeyPair.publicKey,
              space:MINT_SIZE,
              lamports,
              programId:TOKEN_PROGRAM_ID
          }),
          // instruction 2nd -> put data inside the acc
                                          // mint.PublicKey , decimals, mintAuthority, freezeAuth , programId
          createInitializeMint2Instruction(mintKeyPair.publicKey, 9, wallet.publicKey,wallet.publicKey, TOKEN_PROGRAM_ID)
      );
     
      // const signature = await wallet.sendTransaction(transaction, connection,{
      //   signers:[mintKeyPair]
      // });
      // await connection.confirmTransaction(signature, 'finalized');

      

      // As we don't have access to user private key so we can't use create mint function directly,
      // then we use partial sign to sign the transaction by keyPair of mint acc and send 
      // transaction to user wallet to sign it with his private key
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.partialSign(mintKeyPair);
      
      await wallet.sendTransaction(transaction, connection);
        console.log("Token mint created at " + mintKeyPair.publicKey.toBase58());
        const balAfterDeduction = await connection.getBalance(wallet.publicKey);
        console.log(`balance after deduction->  ${balAfterDeduction} `);
    }
    catch(err){
      console.log(err)
      return err;
    }
  }
  return (
    <div className='launch-container'>
        <h1>SOLANA LAUNCHPAD</h1>
        <input type="text" placeholder='NAME'/><br />
        <input type="text" placeholder='SYMBOL'/><br />
        <input type="text" placeholder='Image URL'/><br />
        <input type="text" placeholder='Iinital supply'/><br />
        <button onClick={createToken}>Create Token</button>
    </div>
  )
}

export default TokenLaunch