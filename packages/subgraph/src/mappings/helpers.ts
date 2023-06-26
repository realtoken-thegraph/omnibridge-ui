import { Bytes } from '@graphprotocol/graph-ts';

// headerLength = 79 + sourceChainIdLength + destinationChainIdLength
// for bsc, sokol, kovan, xdai and mainnet chainId < 255
// => len(chainId) = 1
var HEADER_LENGTH = 79 + 1 + 1;
var METHOD_SIGNATURE_LENGTH = 4;
var PADDED_LENGTH = 32;
var ADDRESS_LENGTH = 20;

var handleNativeTokensAndCall = Bytes.fromHexString('0x867f7a4d') as Bytes;
var handleNativeTokens = Bytes.fromHexString('0x272255bb') as Bytes;
var handleBridgedTokensAndCall = Bytes.fromHexString('0xc5345761') as Bytes;
var handleBridgedTokens = Bytes.fromHexString('0x125e4cfb') as Bytes;
var deployAndHandleBridgedTokensAndCall = Bytes.fromHexString(
  '0xd522cfd7',
) as Bytes;
var deployAndHandleBridgedTokens = Bytes.fromHexString('0x2ae87cdd') as Bytes;

export function decodeRecipient(encodedData: Bytes): Bytes | null {
  let data = encodedData.subarray(HEADER_LENGTH + METHOD_SIGNATURE_LENGTH);
  let method = encodedData.subarray(
    HEADER_LENGTH,
    HEADER_LENGTH + METHOD_SIGNATURE_LENGTH,
  ) as Bytes;

  if (
    method == handleNativeTokens ||
    method == handleNativeTokensAndCall ||
    method == handleBridgedTokens ||
    method == handleBridgedTokensAndCall
  ) {
    // _token, 0 - 32
    // _receiver, 32 - 64
    // _value, 64 - 96
    return data.subarray(
      2 * PADDED_LENGTH - ADDRESS_LENGTH, // removing padded zeros
      2 * PADDED_LENGTH,
    ) as Bytes;
  } else if (
    method == deployAndHandleBridgedTokens ||
    method == deployAndHandleBridgedTokensAndCall
  ) {
    // _token, 0 - 32
    // name, 32 - 64
    // symbol, 64 - 96
    // _decimals, 96 - 128
    // _receiver, 128 - 160
    // _value, 160 - 192
    return data.subarray(
      5 * PADDED_LENGTH - ADDRESS_LENGTH, // removing padded zeros
      5 * PADDED_LENGTH,
    ) as Bytes;
  }
  return null;
}
