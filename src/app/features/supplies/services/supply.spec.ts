import { TestBed } from '@angular/core/testing';

import { Supply } from './supply';

describe('Supply', () => {
  let service: Supply;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Supply);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
