# GhostWallet

> Privacy-first burner wallets with zero on-chain linkability


## 🔗 Quick Links

- [Live Demo](#) <!-- TODO: Add demo URL -->
- [Video Walkthrough](https://youtu.be/NrW5uc3P3YU?si=jU_KEqJV5rrqJ5ER) <!-- TODO: Add video URL -->
- [Smart Contracts](./smart-contract/contracts) 

---

## 📖 Overview

**GhostWallet** is a privacy-focused burner wallet system built on Account Abstraction (ERC-4337) that enables users to create temporary, anonymous wallets for short-term transactions. The system combines ephemeral key management, zero-knowledge proofs, and paymaster-sponsored transactions to break on-chain links between users' main wallets and their burner wallets.

In traditional blockchain systems, every transaction is permanently linked to your identity. GhostWallet solves this by creating temporary wallets that cannot be traced back to your main account, giving you true transaction privacy.

With GhostWallet, users can:
- Create disposable wallets with time-limited access
- Execute transactions without revealing their identity
- Destroy wallets and leave no traces behind

---

## ✨ Key Features

- 🏭 **Create Burner Wallets** - Generate temporary, unlinkable wallets on-demand
- ⏱️ **Start Timed Sessions** - Activate wallets with 1-hour ephemeral keys
- 💸 **Execute Transactions** - Send funds privately without revealing your identity
- 🧹 **Sweep & Destroy** - Recover remaining funds and permanently delete wallets

---

## 🏗️ How It Works

### User Flow

```
1. User connects main wallet
   ↓
2. Factory creates GhostWallet (unlinkable via ZK proof)
   ↓
3. User generates ephemeral key locally (encrypted with password)
   ↓
4. User starts 1-hour session
   ↓
5. User executes private transactions
   ↓
6. Session expires or user manually ends it
   ↓
7. User destroys wallet and sweeps funds
```

### Architecture

```
┌─────────────┐
│ Main Wallet │ (Your identity)
└──────┬──────┘
       │ ZK Proof (proves ownership without revealing address)
       ↓
┌─────────────────┐
│ GhostWallet     │ (Burner wallet - unlinkable)
│ Factory         │
└────────┬────────┘
         │ Creates
         ↓
┌─────────────────┐      ┌──────────────┐
│  GhostWallet    │◄─────┤  Ephemeral   │
│  (Burner)       │      │  Session Key │
└────────┬────────┘      └──────────────┘
         │                 (1 hour expiry)
         │ Executes via
         ↓
┌─────────────────┐      ┌──────────────┐
│   EntryPoint    │◄─────┤  Paymaster   │
│   (ERC-4337)    │      │  (Gas sponsor)│
└─────────────────┘      └──────────────┘
```

---

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity** 0.8.20
- **OpenZeppelin** Contracts (ReentrancyGuard, Address utilities)
- **ERC-4337** Account Abstraction standard

### Frontend
- **[Framework]** <!-- TODO: Add framework (React/Next.js/etc) -->
- **ethers.js** / **web3.js** for blockchain interaction
- **WebCrypto API** for local key encryption

### Backend
- **Node.js** with Express
- **MongoDB** for proof tracking and replay protection
- **Web3.js** for contract interaction

### Zero-Knowledge Proofs
- **Circuit Design**: Ownership verification without identity revelation
- **Architecture**: Groth16 verifier integration ready
- **Current Status**: Placeholder verifier for demo (production circuit in development)

---

## 📜 Smart Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| **GhostFactory** | See `config/contracts.json` | Deploys new burner wallets |
| **GhostWallet** | Implementation | Individual burner wallet logic |
| **EntryPoint** | See `config/contracts.json` | ERC-4337 transaction routing |
| **Paymaster** | See `config/contracts.json` | Gas sponsorship and reimbursement |
| **ZKProofVerifier** | See `config/contracts.json` | Zero-knowledge proof verification |

**Network**: Base Sepolia Testnet

> 📁 All deployed contract addresses are available in `smart-contracts/contracts/config/contracts.json`

[View Contracts on BaseScan](#) <!-- TODO: Add BaseScan link -->

---

## 🚀 Getting Started

### Prerequisites

- Node.js v16+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet ETH ([Get from faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ghostwallet.git
cd ghostwallet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the development server
npm run dev
```



## 🎬 Demo

### Live Application
[Launch Demo](#) <!-- TODO: Add demo URL -->

### Video Walkthrough
[Watch on YouTube](https://youtu.be/NrW5uc3P3YU?si=jU_KEqJV5rrqJ5ER) <!-- TODO: Add video URL -->

### Screenshots

![Dashboard](./assets/dashboard.png)
*Dashboard showing active burner wallets*

![Create Wallet](./assets/create-wallet.png)
*Creating a new Ghost Wallet*

![Session Active](./assets/session.png)
*Active session with ephemeral key*

---

## 🗺️ Future Roadmap

### Phase 1 (Current - Hackathon MVP)
- ✅ Core burner wallet functionality
- ✅ Session-based ephemeral keys
- ✅ Account Abstraction (ERC-4337)
- ✅ Paymaster gas sponsorship
- ✅ ZK proof architecture design

### Phase 2 (Post-Hackathon)
- 🔄 Full Groth16 ZK circuit implementation
- 🔄 Privacy pool for anonymous funding
- 🔄 Enhanced UI/UX with wallet analytics
- 🔄 Multi-chain support

### Phase 3 (Production)
- 📋 Mainnet deployment
- 📋 Security audits
- 📋 Mobile app support
- 📋 Advanced privacy features

---

## 👥 Team

- **[Jennifer Scottbello]** - Smart Contract Developer
- **[Beulah Ude]** - Frontend Developer <!-- TODO: Add team members -->
- **[Israel Adefokun]** - Backend Developer

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---


**Built with 💜 for privacy-conscious users**
