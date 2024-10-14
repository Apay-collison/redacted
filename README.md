# APAY

APAY is a Discord bot designed to facilitate on-chain payments and interactions on the Aptos blockchain. Users can easily connect their wallets and perform transactions using simple Discord commands. Whether it's sending APT, accessing a faucet, or participating in community votes, APAY streamlines the process on Aptos.

![APAY Logo](<?xml version="1.0" encoding="UTF-8"?><svg id="a" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><path d="M387.07,172.13h-42.4c-4.94,0-9.64-2.12-12.91-5.81l-17.2-19.43c-2.56-2.9-6.25-4.55-10.11-4.55s-7.55,1.66-10.11,4.55l-14.75,16.67c-4.83,5.45-11.76,8.58-19.04,8.58H28.46c-6.61,18.84-10.92,38.74-12.64,59.38H234.92c3.85,0,7.54-1.57,10.2-4.35l20.4-21.29c2.55-2.66,6.07-4.16,9.75-4.16h.84c3.87,0,7.55,1.66,10.11,4.56l17.19,19.43c3.27,3.7,7.97,5.81,12.91,5.81h178.84c-1.72-20.65-6.03-40.55-12.64-59.38h-95.46Z"/><path d="M148.4,356.39c3.85,0,7.54-1.57,10.2-4.35l20.4-21.29c2.55-2.66,6.07-4.16,9.75-4.16h.84c3.87,0,7.55,1.66,10.11,4.55l17.19,19.43c3.27,3.7,7.97,5.81,12.91,5.81h242.36c9.08-18.76,15.73-38.89,19.69-59.98h-232.63c-4.94,0-9.64-2.12-12.91-5.81l-17.19-19.43c-2.56-2.9-6.25-4.55-10.11-4.55s-7.55,1.66-10.11,4.55l-14.75,16.67c-4.83,5.45-11.76,8.58-19.05,8.58H19.12c3.96,21.09,10.62,41.22,19.69,59.98h109.59Z"/><path d="M320.34,107.24c3.85,0,7.54-1.57,10.2-4.35l20.4-21.29c2.55-2.66,6.07-4.16,9.75-4.16h.84c3.87,0,7.55,1.66,10.11,4.56l17.19,19.43c3.27,3.7,7.97,5.81,12.91,5.81h46.09C403.94,48.9,334.13,11.16,255.49,11.16S107.04,48.9,63.15,107.24H320.34Z"/><path d="M227.77,415.83h-63.03c-4.94,0-9.64-2.12-12.91-5.81l-17.19-19.43c-2.56-2.9-6.25-4.55-10.11-4.55s-7.55,1.66-10.11,4.55l-14.75,16.67c-4.83,5.45-11.76,8.58-19.05,8.58h-.98c43.91,47.05,106.44,76.5,175.87,76.5s131.95-29.45,175.87-76.5H227.77Z"/></svg>![Aptos_mark_BLK](https://github.com/user-attachments/assets/4ca17f4b-3461-446a-a24f-2c98077c64e6)
)

## Table of Contents![Uploading Aptos_mark_BLK.svg…]()

- [Features](#features)
- [Commands](#commands)
- [Authentication](#authentication)
- [How it's Made](#how-its-made)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

- Seamless wallet connection and management
- Easy APT transfers between users
- Faucet access for testnet tokens
- Community voting system
- Transaction notifications
- Multi-network support (Aptos Mainnet, Testnet, Devnet)

## Commands

### `/connect`
Connect your Aptos wallet to the bot. Your address will be saved for future use.

### `/check`
View the Aptos address currently connected to your Discord account.

### `/send`
Send APT to another user or address.
- Inputs:
  - `amount`: string (e.g., "0.1" for 0.1 APT)
  - `to_address`: string (Aptos address or Discord user tag)

### `/faucet`
Receive testnet APT to your connected wallet.
- Options: Testnet, Devnet

### `/createVote`
Create a new voting session.
- Inputs:
  - `topic`: string
  - `option1`, `option2`, ..., `option10`: string (2-10 options)

### `/vote`
Participate in an active voting session.
- Selectors:
  - `topic`: The topic of the vote
  - `option`: Your chosen option

### `/tally`
Close a voting session and calculate results.

### `/result`
View the results of a finished voting session.
- Selector:
  - `topic`: The topic of the vote

## Authentication

Wallet authentication is handled through an embedded frontend framework. We use the Petra Wallet for Aptos blockchain interactions.

## How it's Made

1. **Aptos SDK**: Provides the core functionality for interacting with the Aptos blockchain.
2. **Petra Wallet**: Enables seamless wallet connections and transaction signing.
3. **Move Language**: Used for developing smart contracts on the Aptos blockchain.
4. **Discord.py**: Powers the Discord bot interface.
5. **MongoDB**: Manages user data and connects the Discord bot with the APAY website.
6. **Aptos Explorer**: Offers transaction visibility and supports multiple Aptos networks.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/apay.git
   ```

## Usage



## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, or request features.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
