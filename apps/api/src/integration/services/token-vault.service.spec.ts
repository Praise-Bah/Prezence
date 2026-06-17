import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TokenVaultService } from './token-vault.service';

const TEST_KEY = 'a'.repeat(64); // 64 hex chars = 32 bytes

describe('TokenVaultService', () => {
  let service: TokenVaultService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TokenVaultService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue(TEST_KEY) },
        },
      ],
    }).compile();

    service = module.get(TokenVaultService);
  });

  it('roundtrips plaintext through encrypt/decrypt', () => {
    const plaintext = 'ghp_super_secret_token_abc123';
    const { ciphertext, iv, tag } = service.encrypt(plaintext);
    expect(service.decrypt(ciphertext, iv, tag)).toBe(plaintext);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const plaintext = 'same-token';
    const a = service.encrypt(plaintext);
    const b = service.encrypt(plaintext);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it('throws when auth tag is tampered', () => {
    const { ciphertext, iv } = service.encrypt('secret');
    const badTag = Buffer.from('tampered_tag_padded').toString('base64');
    expect(() => service.decrypt(ciphertext, iv, badTag)).toThrow();
  });

  it('throws when ciphertext is tampered', () => {
    const { iv, tag } = service.encrypt('secret');
    const badCiphertext = Buffer.from('corrupted_data_xxx').toString('base64');
    expect(() => service.decrypt(badCiphertext, iv, tag)).toThrow();
  });
});
