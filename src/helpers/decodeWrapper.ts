import { ByteArray, Bytes, ethereum } from "@graphprotocol/graph-ts";

export function decodeWrapper(input: Bytes, types: string): ethereum.Value | null {
    const functionInput = input.subarray(4);

    // prepend a "tuple" prefix (function params are arrays, not tuples)
    const tuplePrefix = ByteArray.fromHexString(
      '0x0000000000000000000000000000000000000000000000000000000000000020'
    );
  
    const functionInputAsTuple = new Uint8Array(
      tuplePrefix.length + functionInput.length
    );
  
    //concat prefix & original input
    functionInputAsTuple.set(tuplePrefix, 0);
    functionInputAsTuple.set(functionInput, tuplePrefix.length);
  
    const tupleInputBytes = Bytes.fromUint8Array(functionInputAsTuple);
    return ethereum.decode(
      types,
      tupleInputBytes
    );
}