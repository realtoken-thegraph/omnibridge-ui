import { Bytes, crypto, Address, ethereum, log } from '@graphprotocol/graph-ts';
import {
  UserRequestForAffirmation,
  UserRequestForSignature,
  RelayedMessage,
  AffirmationCompleted,
  CollectedSignatures,
} from '../types/AMB/AMB';

import { Execution, RequestFixFail, RequestBridgeToken, Token } from '../types/schema';

import { mediatorAddress } from './constants';
import { decodeWrapper } from '../helpers/decodeWrapper';

const HEADER_LENGTH = 83;
const handleBridgedTokens = Bytes.fromHexString('0x401f9bc6');
const fixFailedMessage = Bytes.fromHexString('0x0950d515');
const handleBridgeTokensFromVault = Bytes.fromHexString('0x5ea33235');

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

  if (sender.notEqual(mediatorAddress) || executor.notEqual(mediatorAddress)) return;

  const functionSignature = Bytes.fromUint8Array(encodedData.subarray(HEADER_LENGTH, HEADER_LENGTH + 4))
  const txHash = event.transaction.hash;
  const block = event.block.number;
  const timestamp = event.block.timestamp;

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
      request.from = from;
      request.recipient = recipient;
      request.txHash = txHash;
      request.messageId = messageId;
      request.type = 'Simple';
      request.tokens = tokenIds;
      request.amounts = amounts;
      request.block = block;
      request.timestamp = timestamp;
      request.messageHash = Bytes.fromByteArray(crypto.keccak256(encodedData));
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

      request.from = recipient;
      request.recipient = recipient;
      request.txHash = txHash;
      request.messageId = messageId;
      request.type = 'PropertyVault';
      request.tokens = tokenIds;
      request.amounts = amounts;
      request.block = block;
      request.timestamp = timestamp;
      request.messageHash = Bytes.fromByteArray(crypto.keccak256(encodedData));
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
  }
  else if (functionSignature.equals(fixFailedMessage)) {
    const decoded = Bytes.fromUint8Array(encodedData.subarray(HEADER_LENGTH + 4))
    if (decoded) {
      const request = new RequestFixFail(messageId.toHex())
      if (request) {
        request.txHash = txHash;
        request.messageIdToFix = decoded
        request.messageId = messageId;
        request.block = block;
        request.timestamp = timestamp;
        request.messageHash = Bytes.fromByteArray(crypto.keccak256(encodedData));
        request.save();
      }
    }
  } else {
    log.warning("function signature {} not found", [functionSignature.toHex()])
  }
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
