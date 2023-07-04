import { Address } from "@graphprotocol/graph-ts";

import { RequestBridgeToken, Token } from "../types/schema";

import {
  BuyBackInitiated,
  TokenListSet,
  TokenSet,
  VaultClaimInitiated
} from "../types/RealtMediatorAMB/RealtMediatorAMB";
import { ZERO } from "../helpers/constants";

function getOrCreateToken(address: string): Token {
  let token = Token.load(address);
  if (token == null) {
    token = new Token(address);
    token.remoteAddress = Address.fromString(address);
  }
  return token;
}

export function handleTokenSet(event: TokenSet): void {
  const remoteAddress = event.params.remoteToken.toHex();

  const tokenEntity = getOrCreateToken(remoteAddress);
  tokenEntity.localAddress = event.params.localToken;
  tokenEntity.bridgedVolume = ZERO;
  tokenEntity.save();
}

export function handleTokenListSet(event: TokenListSet): void {
  const localTokenList = event.params.localTokenList;
  const remoteTokenList = event.params.remoteTokenList;

  const len = localTokenList.length;
  for (let i = 0; i < len; i++) {
    const remote = remoteTokenList[i].toHex();
    const tokenEntity = getOrCreateToken(remote);
    tokenEntity.localAddress = localTokenList[i];
    tokenEntity.bridgedVolume = ZERO;
    tokenEntity.save();
  }
}

export function handleVaultClaim(event: VaultClaimInitiated): void {
  const request = RequestBridgeToken.load(event.params.messageId.toHex())
  if (request != null) {
    request.type = 'PropertyVault'
    request.save();
  }
}

export function handleBuyBack(event: BuyBackInitiated): void {
  const request = RequestBridgeToken.load(event.params.messageId.toHex())
  if (request != null) {
    request.type = 'BuyBack'
    request.save();
  }
}
