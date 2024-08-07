import {
  afterAll,
  afterEach,
  assert,
  beforeAll,
  clearStore,
  describe,
  log,
  newMockEvent,
  newTypedMockEvent,
  newTypedMockEventWithParams,
  test,
} from "matchstick-as/assembly/index";
import {
  handleUserRequestForSignature,
  handleAffirmationCompleted,
  handleRelayedMessage,
  handleUserRequestForAffirmation,
  handleCollectedSignatures,
  handleSignedForUserRequest,
} from "../src/mappings/amb";
import { CollectedSignatures, SignedForUserRequest, UserRequestForSignature } from "../src/types/AMB/AMB";
import { ethereum, Bytes, Address, BigInt } from "@graphprotocol/graph-ts";
import { handleRequiredSignaturesChanged } from "../src/mappings/bridgeValidator";
import { RequiredSignaturesChanged } from "../src/types/BridgeValidators/BridgeValidators";


const REQUEST_BRIDGE_TOKENS_TYPE = "RequestBridgeToken";
const REQUEST_FIX_FAIL_TYPE = "RequestFixFail";
const EXECUTION_TYPE = "Execution";
const TOKEN_TYPE = "Token";
const MESSAGE_TYPE = "Message";
const COLLECTED_SIGNATURE_TYPE = "CollectedSignatureEntity";

const REQUIRED_SIGNATURE_TYPE = "RequiredSignature";

const messageHash = Bytes.fromHexString("0x9d9e80ba2fd7eebc7964c1153d40a1b7ef92b19543a4fafa7ffeed51cd86afef")

describe("handleUserRequestForSignature()", () => {
  beforeAll(() => {
    const encodedRequiredSignatures = new ethereum.EventParam('requiredSignatures', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1)))

    const event = newTypedMockEventWithParams<RequiredSignaturesChanged>([
      encodedRequiredSignatures,
    ]);

    const signer = Address.fromBytes(Bytes.fromHexString("0x258667E543C913264388B33328337257aF208a8f"))
    const signerParam = new ethereum.EventParam('signer', ethereum.Value.fromAddress(signer))
    const messageHashParam = new ethereum.EventParam('messageHash', ethereum.Value.fromBytes(messageHash))


    const SignedForUserRequestEvent = newTypedMockEventWithParams<SignedForUserRequest>([signerParam, messageHashParam])
    SignedForUserRequestEvent.transaction.input = Bytes.fromHexString("0x630cea8e000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000419560be7c1a04401808be4cee526af8977d394ff39288fdbed9b5a4f66917bff55e487b61703d2cc58ef35e6f520c19179da263944ae06754b5b7018ced35805c1c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000015500050000a7823d6f1e31569f51861e345b30c6bebf70ebe70000000000015f204bf18196e7689c0bcf60e1ee81ec5d8f29ad18bd4bf18196e7689c0bcf60e1ee81ec5d8f29ad18bd001e84800101006401401f9bc60000000000000000000000005fc96c182bb7e0413c08e8e03e9d7efc6cf0b0990000000000000000000000005fc96c182bb7e0413c08e8e03e9d7efc6cf0b099000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000458b169d6d9d5d021d61013e3a01bf7dee29dd9000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000")
    handleSignedForUserRequest(SignedForUserRequestEvent)
    handleRequiredSignaturesChanged(event);

    assert.entityCount(COLLECTED_SIGNATURE_TYPE, 1)
    assert.fieldEquals(COLLECTED_SIGNATURE_TYPE, messageHash.toHex(), "ready", "false")
    assert.entityCount(REQUIRED_SIGNATURE_TYPE, 1)
    assert.fieldEquals(REQUIRED_SIGNATURE_TYPE, "now", 'amount', "1")
  });
  
  afterAll(() => {
    clearStore();
  });
  test("Should create a new Entity handleBridgedTokens", () => {
    const messageId = Bytes.fromHexString("0x00050000A7823D6F1E31569F51861E345B30C6BEBF70EBE70000000000015F20");
    const encodedData = Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000015500050000a7823d6f1e31569f51861e345b30c6bebf70ebe70000000000015f204bf18196e7689c0bcf60e1ee81ec5d8f29ad18bd4bf18196e7689c0bcf60e1ee81ec5d8f29ad18bd001e84800101006401401f9bc60000000000000000000000005fc96c182bb7e0413c08e8e03e9d7efc6cf0b0990000000000000000000000005fc96c182bb7e0413c08e8e03e9d7efc6cf0b099000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000458b169d6d9d5d021d61013e3a01bf7dee29dd9000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000");
    const messageIdParam = new ethereum.EventParam('messageId', ethereum.Value.fromBytes(messageId))
    const encodedDataParam = new ethereum.EventParam('encodedData', ethereum.Value.fromBytes(encodedData))

    const event = newTypedMockEventWithParams<UserRequestForSignature>([
      messageIdParam,
      encodedDataParam,
    ]);
    // log.info("encoded: {}\nmessageId: {}", [encodedData.toHex(), messageId.toHex()]);
    handleUserRequestForSignature(event);
    assert.entityCount(REQUEST_BRIDGE_TOKENS_TYPE, 1)
    assert.fieldEquals(REQUEST_BRIDGE_TOKENS_TYPE, messageId.toHex(), 'from', "0x5fc96c182bb7e0413c08e8e03e9d7efc6cf0b099")
    assert.fieldEquals(REQUEST_BRIDGE_TOKENS_TYPE, messageId.toHex(), 'recipient', "0x5fc96c182bb7e0413c08e8e03e9d7efc6cf0b099")
    assert.fieldEquals(REQUEST_BRIDGE_TOKENS_TYPE, messageId.toHex(), 'messageId', messageId.toHex())
  });

  test("Should create a new Entity fixFailedMessage", () => {
    const messageId = Bytes.fromHexString("0x0005000080bc8e935be9775da0aff795ea3437cced5aa1b7000000000000006a");
    const encodedData = Bytes.fromHexString("0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000770005000080bc8e935be9775da0aff795ea3437cced5aa1b7000000000000006a4ad100a0c602f27fa3ecdaee8c58e9427d6a2a9b4ad100a0c602f27fa3ecdaee8c58e9427d6a2a9bffffffff030100aa36a7050950d515000500002e231b96e681c26b0dd7f8b7fbee360177352e6c000000000000005a000000000000000000");
    const messageIdParam = new ethereum.EventParam('messageId', ethereum.Value.fromBytes(messageId))
    const encodedDataParam = new ethereum.EventParam('encodedData', ethereum.Value.fromBytes(encodedData))

    const event = newTypedMockEventWithParams<UserRequestForSignature>([
      messageIdParam,
      encodedDataParam,
    ]);
    assert.entityCount(REQUEST_FIX_FAIL_TYPE, 0)
    handleUserRequestForSignature(event);
    assert.entityCount(REQUEST_FIX_FAIL_TYPE, 1)
    assert.fieldEquals(REQUEST_FIX_FAIL_TYPE, messageId.toHex(), 'messageIdToFix', "0x0005000080bc8e935be9775da0aff795ea3437cced5aa1b70000000000000000")
    assert.fieldEquals(REQUEST_FIX_FAIL_TYPE, messageId.toHex(), 'messageId', messageId.toHex())
  });


  test("Should create a new Entity handleCollectedSignatures", () => {
    
    const encodedAuthority = new ethereum.EventParam('authorityResponsibleForRelay', ethereum.Value.fromBytes(Bytes.fromHexString("0x258667E543C913264388B33328337257aF208a8f")))
    const encodedMessageHash = new ethereum.EventParam('messageHash', ethereum.Value.fromBytes(messageHash))
    const encodedNumberOfCollectedSignatures = new ethereum.EventParam('NumberOfCollectedSignatures', ethereum.Value.fromUnsignedBigInt(BigInt.fromString("4")))

    let event = newTypedMockEventWithParams<CollectedSignatures>([
      encodedAuthority,
      encodedMessageHash,
      encodedNumberOfCollectedSignatures
    ]);
    event.transaction.input = Bytes.fromHexString("0x630cea8e000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000419560be7c1a04401808be4cee526af8977d394ff39288fdbed9b5a4f66917bff55e487b61703d2cc58ef35e6f520c19179da263944ae06754b5b7018ced35805c1c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000015500050000a7823d6f1e31569f51861e345b30c6bebf70ebe70000000000015f204bf18196e7689c0bcf60e1ee81ec5d8f29ad18bd4bf18196e7689c0bcf60e1ee81ec5d8f29ad18bd001e84800101006401401f9bc60000000000000000000000005fc96c182bb7e0413c08e8e03e9d7efc6cf0b0990000000000000000000000005fc96c182bb7e0413c08e8e03e9d7efc6cf0b099000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000458b169d6d9d5d021d61013e3a01bf7dee29dd9000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000")
    
    assert.fieldEquals(COLLECTED_SIGNATURE_TYPE, messageHash.toHex(), "ready", "false")

    handleCollectedSignatures(event);

    assert.entityCount(COLLECTED_SIGNATURE_TYPE, 1)
    assert.fieldEquals(COLLECTED_SIGNATURE_TYPE, messageHash.toHex(), "ready", "true")
  });
});
