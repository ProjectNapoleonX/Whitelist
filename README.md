# NaPoleonX contracts

## Design

### Crowdsale
The entry point. Contributors send ether to this address.
Depending on whether the contributor is whitelisted, the ether is transfered to PendingContributions or to WhitelistedGateway

### Pending
Contributions are stored in PendingContributions. Their transfer to the gateway can be retried, succeeding if they are now whitelisted.

### Gateway
The gateway is connected to the Whitelist to let Crowdsale and Pending knwo whether a contribution is valid.
When it gets a contribution, it forwards the amount to the Vault and emits an event to keep track of contribution sources and amounts.

### Vault
The existing NPX vault.


```
                    ____________
        unknown    |           | 
         --------->|  pending  |------------
         |         |___________|            |
_________|___                            ___v________              __________
|           |                            |          |              |         |
| crowdsale | -------------------------->|  gateway | ------------>|  vault  |
|___________|      whitelisted           |__________|              |_________|
```

## Deployment
1. Install truffle by running `npm i -g truffle`
2. Install local dependecies by running `npm install`. 
3. Set up `config.json` with the appropriate values (VAULT is the ultimate destination for the funds, START_DATE the UNIX timestamp of the start of the sale, END_DATE the UNIX timestamp of the end of the sale)
4. Set up the connection to an Ethereum node. Make sure you control the address at index 0.
5. Run `truffle migrate`

