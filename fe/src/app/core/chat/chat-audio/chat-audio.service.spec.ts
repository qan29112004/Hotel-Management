import { TestBed } from '@angular/core/testing';

import { ChatAudioService } from './chat-audio.service';

describe('ChatAudioService', () => {
  let service: ChatAudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatAudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
