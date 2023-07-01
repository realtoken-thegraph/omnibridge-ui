import { Address } from '@graphprotocol/graph-ts';

import { Token } from '../types/schema';

import { TokenListSet, TokenSet } from '../types/RealtMediatorAMB/RealtMediatorAMB';

function getOrCreateToken(address: string): Token {
    let token = Token.load(address)
    if (token == null) {
        token = new Token(address)
        token.address = Address.fromString(address);
    }
    return token;
}

export function handleTokenSet(
  event: TokenSet,
): void {
  const localToken = event.params.localToken.toHex()

  const tokenEntity = getOrCreateToken(localToken)
  tokenEntity.remoteAddress = event.params.remoteToken
  tokenEntity.save();
}

export function handleTokenListSet(
    event: TokenListSet,
  ): void {
    const localTokenList = event.params.localTokenList
    const remoteTokenList = event.params.remoteTokenList
  
    const len = localTokenList.length;
    for (let i = 0; i < len; i++) {
        const local = localTokenList[i].toHex();
        const tokenEntity = getOrCreateToken(local)
        tokenEntity.remoteAddress = remoteTokenList[i]
        tokenEntity.save();
    }
  }
  
