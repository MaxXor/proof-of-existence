# What is proof of existence?

A service to anonymously and securely store an online distributed proof of existence for any document, agreement, or contract. Your documents are NOT stored in a database or in the Ethereum blockchain. Check out the [live demo](https://maxxor.org/poe/).

What is stored is a cryptographic digest of the document, linked to the time in which you submitted the document. In this way, you can later certify that the data existed at that time. This service allows you to publicly prove that you have certain information without revealing the data or yourself, with a decentralized certification based on the Ethereum blockchain.

## Common use cases

- Demonstrating data ownership without revealing the actual data
- Document timestamping
- Checking for document integrity

## Technical details

The document is certified via embedding its Keccak-256 digest (an earlier draft of the [FIPS-202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf) standard a.K.a. SHA-3) in a [smart contract](./contracts/Documents.sol) on the Ethereum blockchain. Once the transaction is confirmed, the document is permanently certified and proven to exist at least as early as the time the transaction was confirmed. If the document hadn't existed at the time the transaction entered the blockchain, it would have been impossible to embed its digest in the transaction (see [second pre-image resistant](http://en.wikipedia.org/wiki/Cryptographic_hash_function#Properties)). Embedding some hash and then adapting a future document to match the hash is also impossible (due to the [pre-image resistance of hash functions](http://en.wikipedia.org/wiki/Cryptographic_hash_function#Properties)). This is why once the Ethereum blockchain confirms the transaction generated for the document, its existence is proven, permanently, with no trust required.

## Getting started

1. Install truffle `npm install -g truffle`
2. Start a temporary Ethereum blockchain `truffle develop`
3. In the opened command prompt compile and deploy the contracts by entering `compile` and `migrate`
4. Run `test` to execute the smart contract tests
5. Edit the [contract address](./app/app.js#L17) given by the output of the previously executed `migrate` command
6. To use the browser application spin up a small local webserver serving the `./app` directory