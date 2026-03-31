const express = require('express');
const db = require('../models');
// SECURITY: Trading bot transaction endpoints disabled
// const transactionController = require('../controllers/transactionController');

const router = new express.Router();

// SECURITY: Trading bot transaction endpoints have been disabled
// router.get('/snipping', transactionController.snipping);
// router.get('/front', transactionController.front);

// Return empty arrays for disabled endpoints to prevent frontend errors
router.get('/snipping', (req, res) => {
  res.status(200).json({
    error: false,
    data: []
  });
});

router.get('/front', (req, res) => {
  res.status(200).json({
    error: false,
    data: []
  });
});

router.get('/nft-stats', async (req, res) => {
  try {
    const count = await db.Token.count();
    const clientSaysConnected =
      String(req.query.walletConnected || '').toLowerCase() === 'true';
    const addressRaw =
      typeof req.query.walletAddress === 'string'
        ? req.query.walletAddress.trim()
        : '';
    const validAddress = /^0x[a-fA-F0-9]{40}$/.test(addressRaw);

    let walletConnected = clientSaysConnected;
    if (walletConnected && !validAddress) {
      walletConnected = false;
    }

    const payload = {
      totalNFTs: count,
      walletConnected
    };
    if (validAddress && walletConnected) {
      payload.walletAddress = addressRaw;
    }

    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({
      error: true,
      message: err.message
    });
  }
});

module.exports = router;