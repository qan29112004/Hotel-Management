import { TestBed } from '@angular/core/testing';

import { RateplanService } from './rateplan.service';

describe('RateplanService', () => {
  let service: RateplanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RateplanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
