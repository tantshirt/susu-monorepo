export interface Signer {
  readonly source: 'privy' | 'wallet-standard';
  readonly publicKey: string;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signTransaction<TTransaction>(transaction: TTransaction): Promise<TTransaction>;
}
