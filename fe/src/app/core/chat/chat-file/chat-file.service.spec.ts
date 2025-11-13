import { TestBed } from '@angular/core/testing';

import { ChatFileService } from './chat-file.service';

describe('ChatFileService', () => {
  let service: ChatFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
