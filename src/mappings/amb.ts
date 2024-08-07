import { Bytes, crypto, Address, ethereum, log, BigInt } from '@graphprotocol/graph-ts';
import {
  UserRequestForAffirmation,
  UserRequestForSignature,
  RelayedMessage,
  AffirmationCompleted,
  CollectedSignatures,
  SignedForUserRequest,
} from '../types/AMB/AMB';

import { Execution, RequestFixFail, RequestBridgeToken, Token, CollectedSignatureEntity, RequiredSignature } from '../types/schema';

import { mediatorAddress } from './constants';
import { decodeWrapper } from '../helpers/decodeWrapper';
import { FIXFAILED, HEADER_LENGTH, PROPERTYVAULT, SIMPLE, fixFailedMessage, handleBridgeTokensFromVault, handleBridgedTokens, submitSignature } from './helpers';
import { currentId } from './bridgeValidator';

function getTypeFromSelector(selector: Bytes): string {
  const c = selector.toHex();
  if (c == handleBridgedTokens.toHex()) return SIMPLE;
  if (c == handleBridgeTokensFromVault.toHex()) return PROPERTYVAULT;
  if (c == fixFailedMessage.toHex()) return FIXFAILED;
  return SIMPLE;
}

function handleExecution(executor: Address, sender: Address, messageId: Bytes, status: boolean, event: ethereum.Event): void {
  if (executor.notEqual(mediatorAddress) || sender.notEqual(mediatorAddress)) return;

  const id = messageId.toHex();
  const execution = new Execution(id);
  execution.messageId = messageId;
  execution.txHash = event.transaction.hash;
  execution.block = event.block.number;
  execution.timestamp = event.block.timestamp;
  execution.status = status;
  execution.save();
}

function handleRequest(encodedData: Bytes, messageId: Bytes, event: ethereum.Event): void {
  const sender = Address.fromUint8Array(encodedData.subarray(32, 52));
  const executor = Address.fromUint8Array(encodedData.subarray(52, 72));

  if (sender.notEqual(mediatorAddress) || executor.notEqual(mediatorAddress)) return log.error("sender {} executor {} | @ {}", [sender.toHex(), executor.toHex(), event.transaction.hash.toHex()])

  const functionSignature = Bytes.fromUint8Array(encodedData.subarray(HEADER_LENGTH, HEADER_LENGTH + 4))
  const txHash = event.transaction.hash;
  const block = event.block.number;
  const timestamp = event.block.timestamp;
  
  const messageHash = Bytes.fromByteArray(crypto.keccak256(encodedData));
  let getRequiredSignature = RequiredSignature.load(currentId)
  if (getRequiredSignature == null) {
    getRequiredSignature = new RequiredSignature(currentId)
    getRequiredSignature.amount = BigInt.fromI32(4);
    getRequiredSignature.save();
  }
  if (functionSignature.equals(handleBridgedTokens)) {
    const decoded = decodeWrapper(Bytes.fromUint8Array(encodedData.subarray(HEADER_LENGTH)), "(address,address,address[],uint256[])")
    if (decoded) {
      const tuppleForm = decoded.toTuple();
      const from = tuppleForm[0].toAddress()
      const recipient = tuppleForm[1].toAddress()
      const tokens = tuppleForm[2].toAddressArray()
      const amounts = tuppleForm[3].toBigIntArray()
      const request = new RequestBridgeToken(messageId.toHex())
      const tokenIds = tokens.map<string>((val) => val.toHex());
      const tokenBytes = tokens.map<Bytes>((val) => Bytes.fromByteArray(val));

      request.from = from;
      request.recipient = recipient;
      request.txHash = txHash;
      request.messageId = messageId;
      request.type = SIMPLE;
      request.tokensOrder = tokenBytes;
      request.tokens = tokenIds;
      request.amounts = amounts;
      request.block = block;
      request.timestamp = timestamp;
      request.messageHash = messageHash;
      request.requiredSignature = getRequiredSignature.amount;
      request.save();
      const len = tokens.length;
      for (let index = 0; index < len; index++) {
        const token = tokenIds[index];
        const tokenEntity = Token.load(token)
        if (tokenEntity != null) {
          tokenEntity.bridgedVolume = tokenEntity.bridgedVolume.plus(amounts[index])
          tokenEntity.save();
        }
      }
    }
  } else if (functionSignature.equals(handleBridgeTokensFromVault)) {
    const decoded = decodeWrapper(Bytes.fromUint8Array(encodedData.subarray(HEADER_LENGTH)), "(address,address[],uint256[])")
    if (decoded) {
      const tuppleForm = decoded.toTuple();
      const recipient = tuppleForm[0].toAddress()
      const tokens = tuppleForm[1].toAddressArray()
      const amounts = tuppleForm[2].toBigIntArray()

      const request = new RequestBridgeToken(messageId.toHex())
      const tokenIds = tokens.map<string>((val) => val.toHex());
      const tokenBytes = tokens.map<Bytes>((val) => Bytes.fromByteArray(val));

      request.from = recipient;
      request.recipient = recipient;
      request.txHash = txHash;
      request.messageId = messageId;
      request.type = PROPERTYVAULT;
      request.tokens = tokenIds;
      request.tokensOrder = tokenBytes;
      request.amounts = amounts;
      request.block = block;
      request.timestamp = timestamp;
      request.messageHash = messageHash;
      request.requiredSignature = getRequiredSignature.amount;
      request.save();
      const len = tokens.length;
      for (let index = 0; index < len; index++) {
        const token = tokenIds[index];
        const tokenEntity = Token.load(token)
        if (tokenEntity != null) {
          tokenEntity.bridgedVolume = tokenEntity.bridgedVolume.plus(amounts[index])
          tokenEntity.save();
        }
      }

    }
  } else if (functionSignature.equals(fixFailedMessage)) {
    const decoded = decodeWrapper(Bytes.fromUint8Array(encodedData.subarray(HEADER_LENGTH)), "(bytes32)")
    if (decoded) {
      const tuppleForm = decoded.toTuple();
      const messageIdToFix = tuppleForm[0].toBytes()
      const request = new RequestFixFail(messageId.toHex())
      request.txHash = txHash;
      request.messageIdToFix = messageIdToFix
      request.messageId = messageId;
      request.type = FIXFAILED;
      request.block = block;
      request.timestamp = timestamp;
      request.messageHash = messageHash;
      request.requiredSignature = getRequiredSignature.amount;
      request.save();
    }
  } else {
    log.warning("function signature {} not found", [functionSignature.toHex()])
    log.warning("tx hash {}", [event.transaction.hash.toHex()])
  }
}

function getInput(input: Bytes): Bytes | null {
  const inputString = input.toHex().slice(2)
  const lastIndex = inputString.lastIndexOf(submitSignature.toHex().slice(2))
  if (lastIndex === -1 || inputString.length - lastIndex < 664) return null;
  return Bytes.fromHexString(inputString.substring(lastIndex));
}

export function handleSignedForUserRequest(
  event: SignedForUserRequest,
): void {
  const input = getInput(event.transaction.input)
  if (!input) return;

  const sender = Address.fromUint8Array(input.subarray(260, 280));
  const executor = Address.fromUint8Array(input.subarray(280, 300));

  if (sender.notEqual(mediatorAddress) || executor.notEqual(mediatorAddress)) return;

  const messageHash = event.params.messageHash;

  const decoded = decodeWrapper(input, "(bytes,bytes)")
  if (decoded) {
    const tuppleForm = decoded.toTuple();
    const signature = tuppleForm[0].toBytes()
    const message = tuppleForm[1].toBytes()

    let entity = CollectedSignatureEntity.load(messageHash.toHex())
    if (entity == null) {
      entity = new CollectedSignatureEntity(messageHash.toHex())
      entity.messageData = message;
      entity.messageId = Bytes.fromUint8Array(message.subarray(0, 32));
      const selector = Bytes.fromUint8Array(message.subarray(HEADER_LENGTH, HEADER_LENGTH + 4))
      entity.type = getTypeFromSelector(selector)
      entity.messageHash = messageHash;
      entity.ready = false;
      entity.signatures = [signature];
      entity.blockNumber = event.block.number;
      entity.txHash = event.transaction.hash;
      entity.save();
    } else {
      const sig = entity.signatures
      sig.push(signature)
      entity.signatures = sig;
      entity.txHash = event.transaction.hash;
      entity.blockNumber = event.block.number;
      entity.save();
    }
  } else {
    log.warning("couldn't decode in handleSignedForUserRequest", [])
  }
}

export function handleCollectedSignatures(
  event: CollectedSignatures,
): void {  
  const input = getInput(event.transaction.input)
  if (!input) return;
  const sender = Address.fromUint8Array(input.subarray(260, 280));
  const executor = Address.fromUint8Array(input.subarray(280, 300));

  if (sender.notEqual(mediatorAddress) || executor.notEqual(mediatorAddress)) return;

  const messageHash = event.params.messageHash;
  const entity = CollectedSignatureEntity.load(messageHash.toHex())
  if (entity == null) return log.error("Got collected signatures without request for user signature!", [])
  entity.ready = true;  
  entity.txHash = event.transaction.hash;
  entity.blockNumber = event.block.number;
  entity.save();
}

export function handleUserRequestForAffirmation(
  event: UserRequestForAffirmation,
): void {
  const encodedData = event.params.encodedData;
  const messageId = event.params.messageId;
  handleRequest(encodedData, messageId, event)
}

export function handleUserRequestForSignature(
  event: UserRequestForSignature,
): void {
  const encodedData = event.params.encodedData;
  const messageId = event.params.messageId;
  handleRequest(encodedData, messageId, event)
}

export function handleRelayedMessage(event: RelayedMessage): void {
  const executor = event.params.executor
  const sender = event.params.sender
  const messageId = event.params.messageId;
  const status = event.params.status
  handleExecution(executor, sender, messageId, status, event);
}

export function handleAffirmationCompleted(event: AffirmationCompleted): void {
  const executor = event.params.executor
  const sender = event.params.sender
  const messageId = event.params.messageId;
  const status = event.params.status
  handleExecution(executor, sender, messageId, status, event);
}
