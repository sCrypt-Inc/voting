import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  Snackbar,
  Alert,
  Link,
} from "@mui/material";

import { Scrypt, ScryptProvider, SensiletSigner, ContractCalledEvent, ByteString } from "scrypt-ts";

import { Voting } from "./contracts/voting";

// `npm run deploycontract` to get deployment transaction id
const contract_id = {
  /** The deployment transaction id */
  txId: "1556b591bffdcf1e50edbfa6c93ff9a1f6ce06550865a0fbb6228450af95e376",
  /** The output index */
  outputIndex: 0,
};

function byteString2utf8(b: ByteString){
  return Buffer.from(b, "hex").toString("utf8")
}

function App() {
  const [votingContract, setContract] = useState<Voting>();
  const signerRef = useRef<SensiletSigner>();
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState<{
    txId: string,
    candidate: string
  } >({
    txId: '',
    candidate: ''
  });

  async function fetchContract() {

    try {
      const instance = await Scrypt.contractApi.getLatestInstance(
        Voting,
        contract_id
      );
      setContract(instance);
    } catch (error: any) {
      console.error("fetchContract error: ", error);
      setError(error.message)
    }
  }

  useEffect(() => {
    const provider = new ScryptProvider();
    const signer = new SensiletSigner(provider);

    signerRef.current = signer;

    fetchContract();

    const subscription = Scrypt.contractApi.subscribe({
      clazz: Voting,
      id: contract_id
    }, (event: ContractCalledEvent<Voting>) => {

      setSuccess({
        txId: event.tx.id,
        candidate: byteString2utf8(event.args[0] as ByteString)
      });
      setContract(event.nexts[0]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setError('');
  };

  const handleSuccessClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSuccess({
      txId: '',
      candidate: ''
    })
  };

  let rows: Array<any> = [];

  async function voting(e: any) {

    const signer = signerRef.current as SensiletSigner;

    if (votingContract && signer) {
      const { isAuthenticated, error } = await signer.requestAuth();
      if (!isAuthenticated) {
        throw new Error(error);
      }

      await votingContract.connect(signer);

      // create the next instance from the current
      const nextInstance = votingContract.next();

      const candidateName = e.target.name;

      // update state
      nextInstance.increaseVotesReceived(candidateName);

      // call the method of current instance to apply the updates on chain
      votingContract.methods
        .vote(candidateName, {
          next: {
            instance: nextInstance,
            balance: votingContract.balance,
          },
        })
        .then((result) => {
          console.log(`Voting call tx: ${result.tx.id}`);
        })
        .catch((e) => {
          setError(e.message);
          fetchContract();
          console.error("call error: ", e);
        });
    }
  }

  if (votingContract) {
    rows = votingContract.candidates.map((candidate) => {
      return (
        <TableRow hover >
          <TableCell>
            {byteString2utf8(candidate.name)}
          </TableCell>
          <TableCell>{candidate.votesReceived.toString()}</TableCell>

          <TableCell>
            <Button variant="text" onClick={voting} name={candidate.name}>
              👍
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  }
 
  return (
    <div className="App">
      <header className="App-header">
        <h2>Who is Satoshi?</h2>
      </header>
      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="demo table">
          <TableHead>
            <TableRow>
              <TableCell>Candidate</TableCell>
              <TableCell>Votes</TableCell>
              <TableCell>Voting</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
        </Table>
      </TableContainer>
      <Snackbar open={error !== ""} autoHideDuration={6000} onClose={handleClose}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>



      <Snackbar open={success.candidate !== '' && success.txId !== ''} autoHideDuration={6000} onClose={handleSuccessClose}>
        <Alert severity="success">
          {" "}
          <Link
            href={`https://test.whatsonchain.com/tx/${success.txId}`}
            target="_blank"
            rel="noreferrer"
          >{`"${success.candidate}" got one vote,  tx: ${success.txId}`}</Link>
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;
