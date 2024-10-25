# NEARby Finance

NEARby is a Discord bot designed to facilitate on-chain payments and interactions on the Near blockchain. Users can easily connect their wallets and perform transactions using simple Discord commands. Whether it's sending NEAR, accessing a faucet, or participating in community votes, NEARby streamlines the process on Near.


## Table of Contents!

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
- Easy NEAR transfers between users
- Faucet access for testnet tokens
- Community voting system
- Transaction notifications
- Multi-network support (Near Mainnet, Testnet, Devnet)

## Commands

### `/connect`
Connect your Near wallet to the bot. Your address will be saved for future use.

### `/check`
View the Near address currently connected to your Discord account.

### `/send`
Send NEAR to another user or address.
- Inputs:
  - `amount`: string (e.g., "0.1" for 0.1 NEAR)
  - `to_address`: string (Near address or Discord user tag)

### `/faucet`
Receive testnet NEAR to your connected wallet.
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

Wallet authentication is handled through an embedded frontend framework. We use the Petra Wallet for Near blockchain interactions.

## How it's Made

1. **Near SDK**: Provides the core functionality for interacting with the Near blockchain.
2. **Petra Wallet**: Enables seamless wallet connections and transaction signing.
3. **Near Language**: Used for developing smart contracts on the Near blockchain.
4. **Discord.py**: Powers the Discord bot interface.
5. **MongoDB**: Manages user data and connects the Discord bot with the NEARby website.
6. **Near Explorer**: Offers transaction visibility and supports multiple Near networks.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/Apay-collison/redacted.git
   ```

## Usage



## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, or request features.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
