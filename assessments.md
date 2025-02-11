**Backend API Endpoint**
- Create `GET /transactions/nft-stats` endpoint in `server/routes/transactions.js`
- Return JSON: `{ totalNFTs: number, walletConnected: boolean }`
- Return mock data or query from database (can use simple count)
- Handle errors with appropriate status codes

**Blockchain Integration**
- Check wallet connection status in frontend using existing wallet context/hooks
- Display wallet address in truncated format (0x1234...5678) when connected

**Frontend Component**
- Create `src/components/NFTStats.js` component
- Fetch from `/transactions/nft-stats` using `src/api/Api.js` service
- Display two cards: total NFTs count, wallet connection status (green badge if connected, red if not)
- Implement loading spinner

**Integration**
- Add route `/dashboard/nft-stats` in `src/routes/routes.js`

**Verification**
- Cards display with correct data from API
- Wallet connection status badge shows correct color (green/red)
- Component renders correctly in dashboard layout
- Test MetaMask connect wallet function: verify wallet connection/disconnection works correctly, address updates when connected, and connection status reflects in real-time

**Pull Request Submission**
- After completing all the above requirements, create a pull request to the GitHub repository
- Ensure your PR includes all the implemented changes and follows the repository's contribution guidelines
- Submit your pull request link for review through the assessment submission form
- The PR should be properly titled and include a description of the changes made