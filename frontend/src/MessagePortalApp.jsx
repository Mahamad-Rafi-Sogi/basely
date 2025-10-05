import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import messagePortalInfo from '../messagePortalInfo.json';
import './styles.css';

export default function MessagePortalApp() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pendingTx, setPendingTx] = useState(false);
  const [status, setStatus] = useState('');
  const [input, setInput] = useState('');
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [autoScroll, setAutoScroll] = useState(true);

  const chainIdDec = 84532; // Base Sepolia
  const chainIdHex = '0x' + chainIdDec.toString(16);

  const getContract = useCallback(() => {
    if (!provider) return null;
    const base = signer || provider;
    return new ethers.Contract(messagePortalInfo.address, messagePortalInfo.abi, base);
  }, [provider, signer]);

  // Provider & network init
  useEffect(() => {
    if (!window.ethereum) {
      setStatus('No injected wallet. Install MetaMask or Coinbase Wallet.');
      return;
    }
    const p = new ethers.BrowserProvider(window.ethereum);
    setProvider(p);
    (async () => {
      try {
        const net = await p.getNetwork();
        setWrongNetwork(Number(net.chainId) !== chainIdDec);
      } catch (e) { console.error(e); }
    })();
    window.ethereum.on('chainChanged', () => window.location.reload());
    window.ethereum.on('accountsChanged', (accs) => {
      if (accs.length === 0) { setSigner(null); setAccount(null); }
      else { setAccount(accs[0]); }
    });
  }, []);

  // Event listeners
  useEffect(() => {
    const c = getContract();
    if (!c) return;
    const onNew = (sender, text, ts, index) => {
      setMessages(prev => {
        const exists = prev.find(m => Number(m.index) === Number(index));
        if (exists) return prev; // avoid duplicates
        const merged = [...prev, { sender, text, timestamp: ts, likes: 0, index: Number(index) }];
        return merged.sort((a,b) => a.index - b.index);
      });
      if (autoScroll) scrollToBottom();
    };
    const onLike = (liker, index, newLikeCount) => {
      setMessages(prev => prev.map(m => m.index === Number(index) ? { ...m, likes: Number(newLikeCount) } : m));
    };
    c.on('NewMessage', onNew);
    c.on('MessageLiked', onLike);
    return () => {
      c.off('NewMessage', onNew);
      c.off('MessageLiked', onLike);
    };
  }, [getContract, autoScroll]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = document.querySelector('.messages-end');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  };

  async function connect() {
    if (!provider) return;
    try {
      await provider.send('eth_requestAccounts', []);
      const s = await provider.getSigner();
      setSigner(s);
      const addr = await s.getAddress();
      setAccount(addr);
      setStatus('Wallet connected');
    } catch (e) { setStatus(e.message); }
  }

  async function addNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: 'Base Sepolia',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://sepolia.base.org'],
          blockExplorerUrls: ['https://sepolia.basescan.org']
        }]
      });
      setWrongNetwork(false);
    } catch (e) { setStatus(e.message); }
  }

  async function switchNetwork() {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
      setWrongNetwork(false);
    } catch (e) { setStatus(e.message); }
  }

  async function loadMessages() {
    const c = getContract();
    if (!c) return;
    try {
      const total = await c.totalMessages();
      if (Number(total) === 0) { setMessages([]); return; }
      const page = await c.getMessages(0, total);
      setMessages(page.map((m, idx) => ({ ...m, index: idx })));
    } catch (e) { setStatus(e.message); }
  }

  async function post() {
    if (!input.trim()) return;
    const c = getContract();
    if (!c || !signer) return;
    try {
      setPendingTx(true);
      const clean = input.trim();
      const tx = await c.postMessage(clean);
      setStatus('Posting...');
      setInput('');
      await tx.wait();
      setStatus('Message posted');
    } catch (e) { setStatus(e.message); } finally { setPendingTx(false); }
  }

  async function like(idx) {
    const c = getContract();
    if (!c || !signer) return;
    try {
      setPendingTx(true);
      const tx = await c.likeMessage(idx);
      setStatus('Liking...');
      await tx.wait();
      setStatus('Liked');
      setLikedMap(prev => ({ ...prev, [idx]: true }));
    } catch (e) { setStatus(e.message); } finally { setPendingTx(false); }
  }

  useEffect(() => { if (provider) loadMessages(); }, [provider]);

  return (
    <div className="app-shell">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="brand">Basely</div>
          <div className="network-badge"><span className="network-dot" />Base Sepolia</div>
        </div>
        <div className="wallet-actions">
          {wrongNetwork && (
            <>
              <button className="btn outline" onClick={switchNetwork}>Switch</button>
              <button className="btn outline" onClick={addNetwork}>Add</button>
            </>
          )}
          {account ? (
            <div className="address-pill" title={account}>{account.slice(0,6)}...{account.slice(-4)}</div>
          ) : (
            <button className="btn" onClick={connect}>Connect Wallet</button>
          )}
        </div>
      </header>

      <div className="grid">
        <div className="panel">
          <form className="message-form" onSubmit={e => { e.preventDefault(); post(); }}>
            <textarea
              className="message-input"
              placeholder="Share something with the Base community..."
              maxLength={280}
              value={input}
              disabled={wrongNetwork || pendingTx}
              onChange={e => setInput(e.target.value)}
            />
            <div className="meta-row">
              <span>{input.length}/280</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} /> auto-scroll
                </label>
                <button type="submit" className="btn" disabled={!signer || !input.trim() || pendingTx || wrongNetwork}>Post</button>
              </div>
            </div>
          </form>
        </div>

        <div className="panel" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, letterSpacing: .5 }}>Messages</h2>
            <button className="btn secondary" disabled={pendingTx} onClick={loadMessages}>Refresh</button>
          </div>
          <div className="messages-list">
            {messages.map(m => (
              <div key={m.index} className="message-card">
                <div className="message-header">
                  <span>#{m.index}</span>
                  <span>{new Date(Number(m.timestamp) * 1000).toLocaleString()}</span>
                </div>
                <div className="message-body">{m.text}</div>
                <div className="message-footer">
                  <span className="address-pill" title={m.sender}>{m.sender.slice(0, 8)}...{m.sender.slice(-6)}</span>
                  <button
                    className={"like-btn" + (likedMap[m.index] ? " active" : "")}
                    disabled={!signer || pendingTx || wrongNetwork || likedMap[m.index]}
                    onClick={() => like(m.index)}
                  >👍 {Number(m.likes)}</button>
                </div>
              </div>
            ))}
            {messages.length === 0 && <div className="empty">No messages yet – be the first!</div>}
            <div className="messages-end" />
          </div>
        </div>
      </div>

      <div className="status-bar">
        {status && <span className="badge">{status}</span>}
        {pendingTx && <span className="badge">Pending...</span>}
      </div>

      <footer>
        Contract: {messagePortalInfo.address} • Built on Base Sepolia • Likes & messages update in real-time
      </footer>
    </div>
  );
}
