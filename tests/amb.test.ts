import {
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
} from "../src/mappings/amb";
import { CollectedSignatures, UserRequestForSignature } from "../src/types/AMB/AMB";
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


describe("handleUserRequestForSignature()", () => {
  beforeAll(() => {
    const encodedRequiredSignatures = new ethereum.EventParam('requiredSignatures', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1)))

    const event = newTypedMockEventWithParams<RequiredSignaturesChanged>([
      encodedRequiredSignatures,
    ]);
    handleRequiredSignaturesChanged(event);

    assert.entityCount(REQUIRED_SIGNATURE_TYPE, 1)
    assert.fieldEquals(REQUIRED_SIGNATURE_TYPE, "now", 'amount', "1")
  });
  
  afterEach(() => {
    clearStore();
  });
  test("Should create a new Entity handleBridgedTokens", () => {
    const messageId = Bytes.fromHexString("000500002E231B96E681C26B0DD7F8B7FBEE360177352E6C0000000000000006");
    const encodedData = Bytes.fromHexString("000500002E231B96E681C26B0DD7F8B7FBEE360177352E6C0000000000000006B25434429C608117525F2CC99F39F057C969D28BB25434429C608117525F2CC99F39F057C969D28BFFFFFFFF01030005AA36A7401F9BC60000000000000000000000005FC96C182BB7E0413C08E8E03E9D7EFC6CF0B0990000000000000000000000005FC96C182BB7E0413C08E8E03E9D7EFC6CF0B099000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000C0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000050620AB68605C43AD8F29F2EA2BB98D4931C28CD00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000DE0B6B3A7640000");
    const encodedDataParam = new ethereum.EventParam('encodedData', ethereum.Value.fromBytes(encodedData))
    const messageIdParam = new ethereum.EventParam('messageId', ethereum.Value.fromBytes(messageId))

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
    const messageId = Bytes.fromHexString("000500002E231B96E681C26B0DD7F8B7FBEE360177352E6C0000000000000002");
    const encodedData = Bytes.fromHexString("000500002E231B96E681C26B0DD7F8B7FBEE360177352E6C0000000000000002B25434429C608117525F2CC99F39F057C969D28BB25434429C608117525F2CC99F39F057C969D28BFFFFFFFF01030005AA36A70950D5150005000080BC8E935BE9775DA0AFF795EA3437CCED5AA1B70000000000000000");
    const encodedDataParam = new ethereum.EventParam('encodedData', ethereum.Value.fromBytes(encodedData))
    const messageIdParam = new ethereum.EventParam('messageId', ethereum.Value.fromBytes(messageId))

    const event = newTypedMockEventWithParams<UserRequestForSignature>([
      messageIdParam,
      encodedDataParam,
    ]);
    handleUserRequestForSignature(event);
    assert.entityCount(REQUEST_FIX_FAIL_TYPE, 1)
    assert.fieldEquals(REQUEST_FIX_FAIL_TYPE, messageId.toHex(), 'messageIdToFix', "0x0005000080bc8e935be9775da0aff795ea3437cced5aa1b70000000000000000")
    assert.fieldEquals(REQUEST_FIX_FAIL_TYPE, messageId.toHex(), 'messageId', messageId.toHex())
  });


  test("Should create a new Entity handleCollectedSignatures", () => {
    const messageHash = Bytes.fromHexString("0xA69AB823AD9D5BA885B0FF72DA57096704AFB250E151B3B35B6FFA7918BBCE0F");
    
    const encodedAuthority = new ethereum.EventParam('authorityResponsibleForRelay', ethereum.Value.fromBytes(Bytes.fromHexString("0xbab4dFAeF3a00fB91BAD050D8f3A92A5e042f093")))
    const encodedMessageHash = new ethereum.EventParam('messageHash', ethereum.Value.fromBytes(Bytes.fromHexString("0xFDA24AAAD5413747B42E737476CCF5765314024DB762E04D89BAA523CF1E255E")))
    const encodedNumberOfCollectedSignatures = new ethereum.EventParam('NumberOfCollectedSignatures', ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1")))

    let event = newTypedMockEventWithParams<CollectedSignatures>([
      encodedAuthority,
      encodedMessageHash,
      encodedNumberOfCollectedSignatures
    ]);
    event.transaction.input = Bytes.fromHexString("0x630cea8e000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000041d42f32737f5a86f709beca3cea7b50763b8b1a41c18a832655d29bbd00b311e562eb182aaa2ac02e59d962a4b6e05c1460a1127b6cae9c477da62c2e37b0a0111c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001570005000080bc8e935be9775da0aff795ea3437cced5aa1b700000000000000634ad100a0c602f27fa3ecdaee8c58e9427d6a2a9b4ad100a0c602f27fa3ecdaee8c58e9427d6a2a9bffffffff030100aa36a705401f9bc6000000000000000000000000a042f70099c6d3c997f40336713017981348354b000000000000000000000000a042f70099c6d3c997f40336713017981348354b000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000f1aaacdb0e5acd8f725b4f1eb33e4d976bae87a70000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000")
    handleCollectedSignatures(event);


    const signature = "0x3fe94e8cc06e8a3f8f09260c05a3ff8e72c34c68f9a64e6332ec485f924cd0ab35dfdcc29052f38b422e4829fe48bcaad7c9c0ac103c5573c16b3bc958ed4c431c"
    const messageData = "0x0005000080bc8e935be9775da0aff795ea3437cced5aa1b700000000000000474ad100a0c602f27fa3ecdaee8c58e9427d6a2a9b4ad100a0c602f27fa3ecdaee8c58e9427d6a2a9bffffffff030100aa36a705401f9bc6000000000000000000000000dea22a40b92464bddba209f8ce7700210a3be734000000000000000000000000dea22a40b92464bddba209f8ce7700210a3be734000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000050620ab68605c43ad8f29f2ea2bb98d4931c28cd00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000de0b6b3a7640000"
    assert.entityCount(COLLECTED_SIGNATURE_TYPE, 1)
    assert.fieldEquals(COLLECTED_SIGNATURE_TYPE, messageHash.toHex(), 'messageHash', messageHash.toHex())
    assert.fieldEquals(COLLECTED_SIGNATURE_TYPE, messageHash.toHex(), 'messageData', messageData)
    assert.fieldEquals(COLLECTED_SIGNATURE_TYPE, messageHash.toHex(), 'signature', signature)

  });
});
