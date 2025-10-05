import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import contractInfo from '../contractInfo.json';

export default function Home() {
  const [count, setCount] = useState(null);
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('');
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requiredChainIdHex = '0x' + contractInfo.chainId.toString(16);

  function getContract(providerOrSigner) {
    return new ethers.Contract(contractInfo.address, contractInfo.abi, providerOrSigner);
  }

  async function ensureProvider() {
    if (!window.ethereum) throw new Error('No injected wallet (MetaMask) found.');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== contractInfo.chainId) {
      setWrongNetwork(true);
    } else {
      setWrongNetwork(false);
    }
    return provider;
  }

  async function connectWallet() {
    try {
      setStatus('Connecting wallet...');
      const provider = await ensureProvider();
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
      setStatus('Wallet connected');
      await loadCount();
    } catch (e) {
      setStatus(e.message);
    }
  }

  async function switchNetwork() {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: requiredChainIdHex }]
      });
      setWrongNetwork(false);
      await loadCount();
    } catch (switchError) {
      setStatus('Failed to switch network: ' + (switchError.message || switchError));
    }
  }

  async function addNetwork() {
    if (!window.ethereum) {
      setStatus('No injected wallet found to add network.');
      return;
    }
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: requiredChainIdHex,
          chainName: 'Base Sepolia',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://sepolia.base.org'],
          blockExplorerUrls: ['https://sepolia.basescan.org']
        }]
      });
      setStatus('Network added. Switching...');
      await switchNetwork();
    } catch (err) {
      setStatus('Add network failed: ' + (err.message || err));
    }
  }

  async function loadCount() {
    try {
      setIsLoading(true);
      const provider = await ensureProvider();
      const contract = getContract(provider);
      const value = await contract.count();
      setCount(Number(value));
    } catch (e) {
      setStatus(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function increment() {
    try {
      setIsLoading(true);
      const provider = await ensureProvider();
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      const tx = await contract.increment();
      setStatus('Tx sent: ' + tx.hash.slice(0, 10) + '...');
      await tx.wait();
      setStatus('Increment confirmed');
      loadCount();
    } catch (e) {
      setStatus(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        setTimeout(() => window.location.reload(), 300);
      });
      window.ethereum.on('accountsChanged', (accs) => {
        if (accs.length === 0) {
          setAccount(null);
        } else {
          setAccount(accs[0]);
          loadCount();
        }
      });
    }
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 600 }}>
  <h1>Basely</h1>
      <p style={{ fontSize: 14, color: '#666' }}>Network: {contractInfo.network} (chainId {contractInfo.chainId})</p>
      {wrongNetwork && (
        <div style={{ background: '#ffe2e2', padding: 10, marginBottom: 12 }}>
          <strong>Wrong network.</strong> Please switch to {contractInfo.network}.{' '}
          <button onClick={switchNetwork}>Switch Network</button>{' '}
          <button onClick={addNetwork}>Add Network</button>
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        {account ? (
          <span>Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Counter:</strong>{' '}
        {count === null ? <em> not loaded</em> : count}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={loadCount} disabled={isLoading || wrongNetwork}>Load Count</button>
        <button onClick={increment} disabled={!account || isLoading || wrongNetwork}>Increment</button>
      </div>
      {isLoading && <p style={{ color: '#888' }}>Processing...</p>}
      {status && <p style={{ marginTop: 16, color: '#555' }}>{status}</p>}
      <hr style={{ margin: '24px 0' }} />
      <details>
        <summary>Debug Info</summary>
        <pre style={{ fontSize: 12 }}>{JSON.stringify(contractInfo, null, 2)}</pre>
      </details>
    </div>
  );
}
