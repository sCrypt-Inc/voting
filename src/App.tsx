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
  Typography,
  Box,
  Divider,
  Stack,
  Container,
} from "@mui/material";
import {
  Scrypt,
  ScryptProvider,
  SensiletSigner,
  PandaSigner,
  ContractCalledEvent,
  ByteString,
  Signer,
  TAALSigner,
  bsv,
} from "scrypt-ts";
import { Voting } from "./contracts/voting";
import Footer from "./Footer";
import Popup from "reactjs-popup";

// `npm run deploycontract` to get deployment transaction id
const contract_id = {
  /** The deployment transaction id */
  txId: "98cdfaaeb38cf25abc6260cb09f0ae8f52fa942a02a79a999059c88844b1d2a5",
  /** The output index */
  outputIndex: 0,
};

function byteString2utf8(b: ByteString) {
  return Buffer.from(b, "hex").toString("utf8");
}

enum WalletType {
  YOURS = "yours",
  TAAL = "taal",
  Sensilet = "sensilet",
}

interface ModalProps {
  onConnect: (walletType: WalletType) => void;
}

const Modal = (props: ModalProps) => {
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);
  const { onConnect } = props;

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.target as HTMLButtonElement;
    onConnect(target.name as WalletType);
    closeModal();
  };
  return (
    <Box>
      <Button variant="outlined" onClick={() => setOpen((o) => !o)}>
        Connect a Wallet
      </Button>
      <Popup open={open} closeOnDocumentClick onClose={closeModal}>
        <Box className="modal">
          <button className="close" onClick={closeModal}>
            &times;
          </button>
          <Box className="header">
            <Typography variant="h4">Connect a wallet</Typography>
          </Box>
          <Box className="content">
            <Stack spacing={6} direction="row">
              <Button variant="contained" name="yours" onClick={onClick}>
                Yours wallet
              </Button>
              <Button variant="contained" name="sensilet" onClick={onClick}>
                Sensilet wallet
              </Button>
            </Stack>
          </Box>
        </Box>
      </Popup>
    </Box>
  );
};

interface AccountProps {
  address: string;
  balance: number;
  onLogout: () => void;
}

const Account = (props: AccountProps) => {
  return (
    <Container>
      <Box>
        Address: <span>{props.address}</span>
      </Box>
      <Box>
        Balance: <span>{props.balance}</span>
      </Box>
      <Box>
        <Button
          variant="outlined"
          onClick={() => {
            props.onLogout();
          }}
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
};

function App() {
  const [votingContract, setContract] = useState<Voting>();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const signerRef = useRef<Signer>();
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState<{
    txId: string;
    candidate: string;
  }>({
    txId: "",
    candidate: "",
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
      setError(error.message);
    }
  }

  useEffect(() => {
    fetchContract();

    const subscription = Scrypt.contractApi.subscribe(
      {
        clazz: Voting,
        id: contract_id,
      },
      (event: ContractCalledEvent<Voting>) => {
        setSuccess({
          txId: event.tx.id,
          candidate: event.args[0] as ByteString,
        });
        setContract(event.nexts[0]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setError("");
  };

  const handleConnect = async (walletType: WalletType) => {
    const provider = new ScryptProvider();
    if (walletType === WalletType.YOURS) {
      const signer = new PandaSigner(provider);
      signerRef.current = signer;
    } else if (walletType === WalletType.Sensilet) {
      const signer = new SensiletSigner(provider);
      signerRef.current = signer;
    } else if (walletType === WalletType.TAAL) {
      const signer = new TAALSigner(provider);
      signerRef.current = signer;
    } else {
      alert("ERROR: unknow wallet type");
      return;
    }

    const signer = signerRef.current;

    const { isAuthenticated, error } = await signer.requestAuth();
    if (!isAuthenticated) {
      alert("ERROR: " + error);
      console.error("requestAuth failed: ", error);
      return;
    }
    
    await signer.connect()

    const address = await signer.getDefaultAddress();

    if (address.network !== bsv.Networks.testnet) {
      alert("ERROR: Invalid Network! Pelease switch your wallet to testnet.");
      return;
    }

    setAddress(address.toString());

    const balanceRes = await signer.getBalance();

    setBalance(balanceRes.confirmed);
  };

  const handleLogout = () => {
    signerRef.current = undefined;
    setAddress(null);
  };

  const handleSuccessClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSuccess({
      txId: "",
      candidate: "",
    });
  };

  async function voting(e: any) {
    handleSuccessClose(e);
    const signer = signerRef.current;

    if(!signer) {
      alert("Please connect a wallet first!");
      return;
    }

    if (votingContract) {
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

  return (
    <div className="App">
      <header className="App-header">
        <h2>What's your favorite phone?</h2>
      </header>

      <TableContainer
        component={Paper}
        variant="outlined"
        style={{ width: 1200, height: "80vh", margin: "auto" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">iPhone</TableCell>
              <TableCell align="center">Android</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center">
                <Box>
                  <Box
                    sx={{
                      height: 200,
                    }}
                    component="img"
                    alt={"iphone"}
                    src={`${process.env.PUBLIC_URL}/${"iphone"}.png`}
                  />
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box>
                  <Box
                    sx={{
                      height: 200,
                    }}
                    component="img"
                    alt={"android"}
                    src={`${process.env.PUBLIC_URL}/${"android"}.png`}
                  />
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center">
                <Box>
                  <Typography variant={"h1"}>
                    {votingContract?.candidates[0].votesReceived.toString()}
                  </Typography>
                  <Button
                    variant="text"
                    onClick={voting}
                    name={votingContract?.candidates[0].name}
                  >
                    👍
                  </Button>
                </Box>
              </TableCell>

              <TableCell align="center">
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant={"h1"}>
                    {votingContract?.candidates[1].votesReceived.toString()}
                  </Typography>
                  <Button
                    variant="text"
                    onClick={voting}
                    name={votingContract?.candidates[1].name}
                  >
                    👍
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box marginTop={6}>
          {address !== null ? (
            <Account
              onLogout={handleLogout}
              address={address}
              balance={balance}
            ></Account>
          ) : (
            <Modal onConnect={handleConnect}></Modal>
          )}
        </Box>
      </TableContainer>
      <Footer />
      <Snackbar
        open={error !== ""}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      <Snackbar
        open={success.candidate !== "" && success.txId !== ""}
        autoHideDuration={6000}
        onClose={handleSuccessClose}
      >
        <Alert severity="success">
          {" "}
          <Link
            href={`https://test.whatsonchain.com/tx/${success.txId}`}
            target="_blank"
            rel="noreferrer"
          >
            {`"${byteString2utf8(success.candidate)}" got one vote,  tx: ${
              success.txId
            }`}
          </Link>
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;
