import { Address } from "@graphprotocol/graph-ts";

import { RequestBridgeToken, Token, AdminFix } from "../types/schema";

import {
  BuyBackInitiated,
  ManualFix,
  TokenListSet,
  TokenSet,
} from "../types/RealtMediatorAMB/RealtMediatorAMB";
import { ZERO } from "../helpers/constants";
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

export function handleTokenSet(event: TokenSet): void {
  const remoteAddress = event.params.remoteToken.toHex();
  const localAddress = event.params.localToken;
  let token = Token.load(remoteAddress);
    if (token == null) {
      token = new Token(remoteAddress);
      token.remoteAddress = Address.fromString(remoteAddress);
      token.localAddress = localAddress;
      token.bridgedVolume = ZERO;
    } else if (token.localAddress != localAddress) {
      token.localAddress = localAddress;
      token.bridgedVolume = ZERO;
      
    }
    token.save();
}

export function handleTokenListSet(event: TokenListSet): void {
  const localTokenList = event.params.localTokenList;
  const remoteTokenList = event.params.remoteTokenList;

  const len = localTokenList.length;
  for (let i = 0; i < len; i++) {
    const remote = remoteTokenList[i].toHex();
    let token = Token.load(remote);
    if (token == null) {
      token = new Token(remote);
      token.remoteAddress = Address.fromString(remote);
      token.localAddress = localTokenList[i];
      token.bridgedVolume = ZERO;
    } else if (token.localAddress != localTokenList[i]) {
      token.localAddress = localTokenList[i];
      token.bridgedVolume = ZERO;
    }
    token.save();
  }
}

export function handleBuyBack(event: BuyBackInitiated): void {
  const request = RequestBridgeToken.load(event.params.messageId.toHex())
  if (request != null) {
    request.type = BUYBACK;
    request.save();
  }
}
