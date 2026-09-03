import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { AiAssistantComponent } from './ai-assistant';
import { AiAssistantService, Message } from '@core/services/ai-assistant';

describe('AiAssistantComponent', () => {
  let component: AiAssistantComponent;
  let fixture: ComponentFixture<AiAssistantComponent>;
  let sendMessage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    sendMessage = vi.fn(() => Promise.resolve());
    const messages = signal<Message[]>([
      { role: 'model', content: 'Hola', timestamp: new Date() },
    ]);
    const navigationRequest$ = new Subject<string>();

    await TestBed.configureTestingModule({
      imports: [AiAssistantComponent],
      providers: [
        {
          provide: AiAssistantService,
          useValue: {
            messages,
            isLoading: signal(false),
            isVisible: signal(true),
            navigationRequest$,
            sendMessage,
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAssistantComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('delegates the entered message to the assistant service', async () => {
    component.userInput = '  /clear  ';

    await component.sendMessage();

    expect(sendMessage).toHaveBeenCalledWith('  /clear  ');
    expect(component.userInput).toBe('');
  });

  it('does not send an empty message or send while loading', async () => {
    component.userInput = '   ';
    await component.sendMessage();

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
