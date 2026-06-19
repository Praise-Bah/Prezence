declare const PlaintextAccessTokenBrand: unique symbol;

/** In-memory OAuth/plaintext token — never persist, serialize, or log. */
export type PlaintextAccessToken = string & {
  readonly [PlaintextAccessTokenBrand]: unique symbol;
};

export function toPlaintextAccessToken(value: string): PlaintextAccessToken {
  return value as PlaintextAccessToken;
}
