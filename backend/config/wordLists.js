const cryptoWords = {
    easy: [
        'BITCOIN',
        'ETHEREUM',
        'WALLET',
        'MINING',
        'TOKEN',
        'BLOCK',
        'COIN',
        'HASH',
        'KEY',
        'NODE'
    ],
    medium: [
        'BLOCKCHAIN',
        'CRYPTOGRAPHY',
        'ALTCOIN',
        'BINANCE',
        'STAKING',
        'DEFI',
        'METAMASK',
        'LEDGER',
        'PROTOCOL',
        'EXCHANGE'
    ],
    hard: [
        'CRYPTOCURRENCY',
        'DECENTRALIZED',
        'SMARTCONTRACT',
        'TOKENOMICS',
        'GOVERNANCE',
        'CONSENSUS',
        'VALIDATION',
        'LIQUIDITY',
        'CRYPTOGRAPHY',
        'BLOCKCHAIN'
    ],
    // Hidden bonus words for each difficulty
    hiddenWords: {
        easy: [
            'SATOSHI',    // Bitcoin creator
            'HODL',       // Hold On for Dear Life
            'FOMO',       // Fear Of Missing Out
            'DYOR',       // Do Your Own Research
            'FUD'         // Fear, Uncertainty, Doubt
        ],
        medium: [
            'POLYGON',    // Layer 2 scaling solution
            'AVALANCHE',  // High-performance blockchain
            'CHAINLINK',  // Decentralized oracle network
            'OPTIMISM',   // Layer 2 scaling solution
            'ARBITRUM'    // Layer 2 scaling solution
        ],
        hard: [
            'ZKSYNC',     // Zero-knowledge rollup
            'STARKNET',   // Layer 2 scaling solution
            'MOONSHOT',   // Potential high returns
            'DIAMONDHANDS', // Strong holder
            'WAGMI'       // We're All Gonna Make It
        ]
    }
};

module.exports = cryptoWords;
