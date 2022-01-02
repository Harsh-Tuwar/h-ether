require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/_BmUjcirkSRxZu4yiHFTibjzDCgLc8SV',
      accounts: ['f952e0a597043de6debe1d0c6bee250df0c47ce45682ad9e2f8da24513bb64ab']
    }
  }
}