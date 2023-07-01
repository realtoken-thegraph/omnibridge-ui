# Omnibridge

The OmniBridge [multi-token extension](https://docs.tokenbridge.net/eth-xdai-amb-bridge/multi-token-extension) for the Arbitrary Message Bridge is the simplest way to transfer ANY ERC20/ERC677/ERC827 token to and from the xDai chain.

### Subgraph

#### `yarn subgraph:auth`

```sh
GRAPH_ACCESS_TOKEN=your-access-token-here yarn subgraph:auth
```

#### `yarn subgraph:prepare-<network>`

Generates subgraph.yaml for particular network.
Supported networks are kovan, sokol, xdai and mainnet.

#### `yarn subgraph:codegen`

Generates AssemblyScript types for smart contract ABIs and the subgraph schema.

#### `yarn subgraph:build`

Compiles the subgraph to WebAssembly.

#### `yarn subgraph:deploy-<network>`

Deploys the subgraph for particular network to the official Graph Node.<br/>

-
