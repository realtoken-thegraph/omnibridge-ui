import { Bytes } from '@graphprotocol/graph-ts';

// headerLength = 79 + sourceChainIdLength + destinationChainIdLength
// for bsc, sokol, kovan, xdai and mainnet chainId < 255
// => len(chainId) = 1
export const HEADER_LENGTH = 81; // sepolia chainid length = 8 change this
export const handleBridgedTokens = Bytes.fromHexString('0x401f9bc6') as Bytes;
export const fixFailedMessage = Bytes.fromHexString('0x0950d515') as Bytes;
export const handleBridgeTokensFromVault = Bytes.fromHexString('0x5ea33235');
export const submitSignature = Bytes.fromHexString('0x630cea8e')

export const SIMPLE = 'Simple';
export const BUYBACK = 'BuyBack';
export const PROPERTYVAULT = 'PropertyVault';
export const FIXFAILED = 'FixFailedMsg';