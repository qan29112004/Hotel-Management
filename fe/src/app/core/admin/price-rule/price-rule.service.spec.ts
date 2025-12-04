import { TestBed } from '@angular/core/testing';

import { PriceRuleService } from './price-rule.service';

describe('PriceRuleService', () => {
  let service: PriceRuleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceRuleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
