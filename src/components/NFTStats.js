import React, { useCallback, useEffect, useState } from 'react';

import Api from '../api/Api';
import ContentHeader from './micro/ContentHeader';
import DashContent from './micro/DashContent';

const MANUAL_DISCONNECT_KEY = 'nft_stats_manual_wallet_disconnect';

const isManuallyDisconnected = () =>
  typeof window !== 'undefined' && sessionStorage.getItem(MANUAL_DISCONNECT_KEY) === '1';

const setManuallyDisconnected = (disconnected) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (disconnected) {
    sessionStorage.setItem(MANUAL_DISCONNECT_KEY, '1');
  } else {
    sessionStorage.removeItem(MANUAL_DISCONNECT_KEY);
  }
};

const truncateAddress = (addr) => {
  if (!addr || addr.length < 10) {
    return addr || '';
  }
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

/**
 * @param {{ embed?: boolean }} props
 * When embed is true, omits dashboard ContentHeader/DashContent for use inside Wallet or other layouts.
 */
const NFTStats = ({ embed = false }) => {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [apiError, setApiError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  const loadStats = useCallback(async (address) => {
    const manual = isManuallyDisconnected();
    const connected = Boolean(address) && !manual;
    try {
      const data = await Api.http({
        method: 'get',
        url: '/transactions/nft-stats',
        query: {
          walletConnected: connected ? 'true' : 'false',
          ...(address && connected ? { walletAddress: address } : {})
        }
      });
      setTotalNFTs(typeof data?.totalNFTs === 'number' ? data.totalNFTs : 0);
      setApiError(null);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        (typeof e === 'string' ? e : null) ||
        'Failed to load NFT stats';
      setApiError(msg);
      setTotalNFTs(0);
    }
  }, []);

  const refreshAccounts = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      setWalletAddress(null);
      return null;
    }
    if (isManuallyDisconnected()) {
      setWalletAddress(null);
      return null;
    }
    try {
      const accounts = await eth.request({ method: 'eth_accounts' });
      const addr = accounts?.[0] || null;
      setWalletAddress(addr);
      return addr;
    } catch {
      setWalletAddress(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const addr = await refreshAccounts();
      if (cancelled) {
        return;
      }
      await loadStats(addr);
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAccounts, loadStats]);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) {
      return undefined;
    }
    const handler = async (accounts) => {
      if (isManuallyDisconnected()) {
        setWalletAddress(null);
        setStatsLoading(true);
        await loadStats(null);
        setStatsLoading(false);
        return;
      }
      const addr = accounts?.[0] || null;
      setWalletAddress(addr);
      setStatsLoading(true);
      await loadStats(addr);
      setStatsLoading(false);
    };
    eth.on('accountsChanged', handler);
    return () => {
      eth.removeListener?.('accountsChanged', handler);
    };
  }, [loadStats]);

  const handleConnect = async () => {
    const eth = window.ethereum;
    if (!eth) {
      window.alert('MetaMask or another Web3 wallet extension is not installed.');
      return;
    }
    setManuallyDisconnected(false);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const addr = accounts?.[0] || null;
      setWalletAddress(addr);
      setStatsLoading(true);
      await loadStats(addr);
      setStatsLoading(false);
    } catch {
      setWalletAddress(null);
      setStatsLoading(true);
      await loadStats(null);
      setStatsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setManuallyDisconnected(true);
    setWalletAddress(null);
    setStatsLoading(true);
    await loadStats(null);
    setStatsLoading(false);
  };

  const walletConnected = Boolean(walletAddress) && !isManuallyDisconnected();

  const body = (
    <div
      className={embed ? 'wallet-nft-stats-embed' : 'container'}
      style={{ padding: embed ? '0 0 1.5rem' : '2rem 0' }}>
      {embed && (
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem' }}>NFT Stats</h2>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem' }}>
            On-chain wallet via your browser (e.g. MetaMask). Server records NFT totals and mirrors your
            connection when you connect or switch accounts.
          </p>
        </div>
      )}
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}>
          <div className="loading-spinner" />
          <p>Loading stats...</p>
        </div>
      ) : (
        <>
          {apiError && (
            <p style={{ color: '#dc3545', marginBottom: '1rem' }} role="alert">
              {apiError}
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}>
            <div
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                opacity: statsLoading ? 0.65 : 1,
                transition: 'opacity 0.2s',
              }}>
              <h3 style={{ marginTop: 0 }}>Total NFTs</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{totalNFTs}</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.75, margin: '0.75rem 0 0' }}>
                Count from platform database (assessment endpoint).
              </p>
            </div>
            <div
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                opacity: statsLoading ? 0.65 : 1,
                transition: 'opacity 0.2s',
              }}>
              <h3 style={{ marginTop: 0 }}>Wallet connection</h3>
              <p style={{ margin: '0.5rem 0' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 16,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: walletConnected ? '#d4edda' : '#f8d7da',
                    color: walletConnected ? '#155724' : '#721c24',
                  }}>
                  {walletConnected ? 'Connected' : 'Not connected'}
                </span>
                {statsLoading && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                    Updating…
                  </span>
                )}
              </p>
              {walletConnected && (
                <>
                  <p style={{ fontFamily: 'monospace', margin: '0.5rem 0' }}>
                    {truncateAddress(walletAddress)}
                  </p>
                  <button type="button" className="action-button outlined" onClick={handleDisconnect}>
                    Disconnect
                  </button>
                </>
              )}
              {!walletConnected && (
                <button type="button" className="action-button" onClick={handleConnect}>
                  Connect Wallet
                </button>
              )}
              <p style={{ fontSize: '0.8rem', opacity: 0.75, margin: '0.75rem 0 0' }}>
                Connect uses <code style={{ fontSize: '0.75rem' }}>window.ethereum</code>. Each change syncs to
                the server so the API response matches your session.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (embed) {
    return body;
  }

  return (
    <>
      <ContentHeader>
        <div className="container">
          <div className="head-content">
            <h2>NFT Stats</h2>
            <p>
              Overview of NFT totals and live browser wallet status. Wallet state is read from your extension
              and reflected in API calls.
            </p>
          </div>
        </div>
      </ContentHeader>
      <DashContent>{body}</DashContent>
    </>
  );
};

export default NFTStats;
