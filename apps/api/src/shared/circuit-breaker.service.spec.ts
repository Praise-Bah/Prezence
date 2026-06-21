import { Test } from '@nestjs/testing';
import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CircuitBreakerService],
    }).compile();

    service = module.get(CircuitBreakerService);
  });

  it('calls the wrapped function and returns its result', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const wrapped = service.wrap('test-breaker', fn);

    const result = await wrapped('arg1', 'arg2');

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(result).toBe('ok');
  });

  it('propagates errors thrown by the wrapped function', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('downstream failure'));
    const wrapped = service.wrap('test-error', fn, { volumeThreshold: 1 });

    await expect(wrapped()).rejects.toThrow('downstream failure');
  });

  it('returns the same wrapped function for the same name', () => {
    const fn = jest.fn().mockResolvedValue('x');
    const w1 = service.wrap('same-name', fn);
    const w2 = service.wrap('same-name', fn);
    expect(w1).toBe(w2);
  });

  it('reports closed state when no failures have occurred', () => {
    const fn = jest.fn().mockResolvedValue('ok');
    service.wrap('health-test', fn);

    const health = service.getHealth();
    expect(health['health-test']).toBe('closed');
  });
});
