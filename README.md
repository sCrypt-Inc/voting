# Voting

Build your first decentralized application, or dApp, on the Bitcoin with this tutorial.

[LIVE DEMO](http://classic.scrypt.io/voting/) 🚀

## Step 1. Clone the project

```bash
$ git clone https://github.com/sCrypt-Inc/voting.git
```

## Step 2. Install dependencies

```bash
$ cd voting
$ npm install
```

## Step 3. Compile contract

```bash
$ npx scrypt-cli compile
```

## Step 4. Add your API Key

Use your own API key in file `index.tsx`. If you don't have it, please follow this [guide](https://docs.scrypt.io/advanced/how-to-integrate-scrypt-service#get-your-api-key) to get one.

```ts
Scrypt.init({
  apiKey: 'YOUR_API_KEY',  // <---
  network: 'testnet'
})
```

## Step 5. Deploy contract

Before deploying the contract, create a `.env` file and save your private key in the `PRIVATE_KEY` environment variable.

```text
PRIVATE_KEY=xxxxx
```

If you don't have a private key, please follow [this guide](https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#setup) to generate one using [Sensilet](https://sensilet.com/) wallet, then fund the private key's address with our [faucet](https://scrypt.io/faucet/).

Run the following command to deploy the contract.

```bash
$ npm run deploy:contract
```

After success, you will see an output similar to the following:

![](https://aaron67-public.oss-cn-beijing.aliyuncs.com/202305060511743.png)

Copy the deployment TxID then change the value of `ContractId` in file `src/App.tsx`:

```ts
const contract_id = {
  txId: "bccf73c0f49920fdbd2c66972b6ab14ac098239c429176acf5e599acb7dc6d4a",
  outputIndex: 0,
};
```

## Step 6. Run the frontend app

```bash
$ npm start
```

Runs the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

![](https://aaron67-public.oss-cn-beijing.aliyuncs.com/202305060521385.gif)

If you're interested in how to build this dApp step by step, please refer to this [guide](https://scrypt.io/docs/tutorials/voting/) for more details.
