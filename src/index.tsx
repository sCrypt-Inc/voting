import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Scrypt } from 'scrypt-ts'

import { Voting } from './contracts/voting';
var artifact = require('../artifacts/src/contracts/voting.json');
Voting.loadArtifact(artifact);

Scrypt.init({
  apiKey: 'alpha_test_api_key',
  network: 'testnet'
})

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
