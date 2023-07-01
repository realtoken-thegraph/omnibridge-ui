import {
  afterEach,
  assert,
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
} from "../src/mappings/amb";
import { UserRequestForSignature } from "../src/types/AMB/AMB";
import { ethereum, Bytes } from "@graphprotocol/graph-ts";


const REQUEST_BRIDGE_TOKENS_TYPE = "RequestBridgeToken";
const REQUEST_FIX_FAIL_TYPE = "RequestFixFail";
const EXECUTION_TYPE = "Execution";
const TOKEN_TYPE = "Token";
const MESSAGE_TYPE = "Message";


describe("handleUserRequestForSignature()", () => {
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
});
