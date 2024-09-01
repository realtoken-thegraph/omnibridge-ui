import { Address, store } from "@graphprotocol/graph-ts";

import { RequestBridgeToken, Token, AdminFix, RemoteToken } from "../types/schema";

import {
  BuyBackInitiated,
  ManualFix,
  TokenListSet,
  TokenSet,
} from "../types/RealtMediatorAMB/RealtMediatorAMB";
import { ZERO, ZERO_ADDRESS } from "../helpers/constants";
import { BUYBACK } from "./helpers";

export function handleManualFix(event: ManualFix): void {
    const id = event.params.messageId.toHex();
    const fix = new AdminFix(id)
    fix.from = event.transaction.from;
    fix.txHash = event.transaction.hash;
    fix.messageId = event.params.messageId;
    fix.block = event.block.number;
    fix.timestamp = event.block.timestamp;
    fix.save();
}

function getOrCreateRemoteToken(remoteTokenId: string): RemoteToken {
  let remoteToken = RemoteToken.load(remoteTokenId) 
  if (remoteToken == null) {
    remoteToken = new RemoteToken(remoteTokenId)
  }
  return remoteToken;
}

function remoteTokenLogic(remoteTokenParam: Address, localTokenParam: Address): void {
  const remoteToken = getOrCreateRemoteToken(remoteTokenParam.toHex());
  remoteToken.localAddress = localTokenParam;
  remoteToken.save();
}

function tokenSetLogic(localTokenParam: Address, remoteTokenParam: Address): void {
  const localTokenId = localTokenParam.toHex();
  let token = Token.load(localTokenId);
  if (token == null) {
    if (remoteTokenParam == ZERO_ADDRESS) return;
    token = new Token(localTokenId);
    token.remoteAddress = remoteTokenParam;
    token.localAddress = localTokenParam;
    token.bridgedVolume = ZERO;
    remoteTokenLogic(remoteTokenParam, localTokenParam)
  } else if (token.remoteAddress != remoteTokenParam) {
    token.remoteAddress = remoteTokenParam;
    if (remoteTokenParam != ZERO_ADDRESS) {
      remoteTokenLogic(remoteTokenParam, localTokenParam)
    } else {
      store.remove('RemoteToken', remoteTokenParam.toHex())
    }
  }
  token.save();
}

export function handleTokenSet(event: TokenSet): void {
  tokenSetLogic(event.params.localToken, event.params.remoteToken);
}

export function handleTokenListSet(event: TokenListSet): void {
  const localTokenList = event.params.localTokenList;
  const remoteTokenList = event.params.remoteTokenList;

  const len = localTokenList.length;
  for (let i = 0; i < len; i++) {
    tokenSetLogic(localTokenList[i], remoteTokenList[i]);
  }
}

export function handleBuyBack(event: BuyBackInitiated): void {
  const request = RequestBridgeToken.load(event.params.messageId.toHex())
  if (request != null) {
    request.type = BUYBACK;
    request.save();
  }
}
