import { Bytes } from '@graphprotocol/graph-ts';

// headerLength = 79 + sourceChainIdLength + destinationChainIdLength
// for bsc, sokol, kovan, xdai and mainnet chainId < 255
// => len(chainId) = 1
var HEADER_LENGTH = 83; // sepolia chainid length = 8 change this
var METHOD_SIGNATURE_LENGTH = 4;
var PADDED_LENGTH = 32;
var ADDRESS_LENGTH = 20;

var handleBridgedTokens = Bytes.fromHexString('0x401f9bc6') as Bytes;
var fixFailedMessage = Bytes.fromHexString('0x0950d515') as Bytes;

export function decodeRecipient(encodedData: Bytes): Bytes | null {
  let data = encodedData.subarray(HEADER_LENGTH + METHOD_SIGNATURE_LENGTH);
  let method = encodedData.subarray(
    HEADER_LENGTH,
    HEADER_LENGTH + METHOD_SIGNATURE_LENGTH,
  ) as Bytes;

  if (
    method == handleBridgedTokens ||
    method == fixFailedMessage ||
  ) {
    // _token, 0 - 32
    // _receiver, 32 - 64
    // _value, 64 - 96
    return data.subarray(
      2 * PADDED_LENGTH - ADDRESS_LENGTH, // removing padded zeros
      2 * PADDED_LENGTH,
    ) as Bytes;
  }
  return null;
}
