import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService],
    });
    service = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log errors with console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    service.error('Test error message', new Error('test'));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log warnings with console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    service.warn('Test warning message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
