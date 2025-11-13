import { TestBed } from '@angular/core/testing';

import { ChatChatroomService } from './chat-chatroom.service';

describe('ChatChatroomService', () => {
  let service: ChatChatroomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatChatroomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
