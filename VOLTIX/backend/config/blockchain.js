import crypto from "crypto";

class BlockchainConfig {
  constructor() {
    this.isConnected = false;
    console.log('⚠️ Blockchain disabled - using crypto hashing only');
  }

  // Initialize (no-op for crypto-only mode)
  async initialize() {
    console.log('✅ Crypto hashing service initialized');
    return {
      success: true,
      message: 'Using crypto for hashing (blockchain disabled)'
    };
  }

  // Generate hash for audit data
  generateHash(data) {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
  }

  // Verify hash
  verifyHash(data, expectedHash) {
    const actualHash = this.generateHash(data);
    return actualHash === expectedHash;
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      mode: 'crypto-only',
      blockchain: 'disabled'
    };
  }
}

const blockchainConfig = new BlockchainConfig();
export default blockchainConfig;
