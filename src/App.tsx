import React, { useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
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
} from "@mui/material";

import { Scrypt, ScryptProvider } from "scrypt-ts";
import { SensiletSigner } from "scrypt-ts/dist/bsv/signers/sensilet-signer";
import { Voting } from "./contracts/voting";

function App() {
  const [votingContract, setContract] = useState<Voting>();
  const signerRef = useRef<SensiletSigner>();
  useEffect(() => {
    console.log("useEffect");

    // `npm run deploycontract` to get deployment transaction id
    const contract_id = {
      /** The deployment transaction id */
      txId: "1556b591bffdcf1e50edbfa6c93ff9a1f6ce06550865a0fbb6228450af95e376",
      /** The output index */
      outputIndex: 0,
    };

    const provider = new ScryptProvider();
    const signer = new SensiletSigner(provider);

    signerRef.current = signer;

    Scrypt.contractApi
      .getLatestInstance(Voting, contract_id)
      .then((instance) => {
        setContract(instance);
        console.log("instance", instance);
      });
  }, []);

  let rows: Array<any> = [];

  async function voting(e: any) {
    console.log("voting", e.target.name);

    const signer = signerRef.current as SensiletSigner;


    if (votingContract && signer) {

      const { isAuthenticated, error } = await signer.requestAuth()
      if (!isAuthenticated) {
        throw new Error(error)
      }

      await votingContract.connect(signer)

      // create the next instance from the current
      const nextInstance = votingContract.next();

      const candidateName = e.target.name;

      // update state
      nextInstance.increaseVotesReceived(candidateName);

      // call the method of current instance to apply the updates on chain
      votingContract.methods.vote(candidateName, {
        next: {
          instance: nextInstance,
          balance: votingContract.balance
        },
      }).then(result => {
        console.log(`Voting call tx: ${result.tx.id}`)
        setContract(nextInstance)
      })
    }
  }

  if (votingContract) {
    rows = votingContract.candidates.map((candidate) => {
      return (
        <TableRow>
          <TableCell>
            {Buffer.from(candidate.name, "hex").toString("utf8")}
          </TableCell>
          <TableCell>{candidate.votesReceived.toString()}</TableCell>

          <TableCell>
            <Button variant="text" onClick={voting} name={candidate.name}>
              Voting
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <h2>Who is real satoshi?</h2>
        <p>Voting on Bitcoin</p>
      </header>
      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="demo table">
          <TableHead>
            <TableRow>
              <TableCell>Candidate</TableCell>
              <TableCell>Votes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default App;
