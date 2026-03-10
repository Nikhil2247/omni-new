import { ChatbotLanguageIntentService } from './chatbot-language-intent.service';

describe('ChatbotLanguageIntentService', () => {
  const service = new ChatbotLanguageIntentService();

  it('detects hinglish and normalizes common tokens', () => {
    const result = service.normalizeMessage('shaadi budget in mumbai for photographer');

    expect(result.detectedLanguage).toBe('hinglish');
    expect(result.normalizedMessage).toContain('wedding');
    expect(result.normalizedMessage).toContain('photography vendor');
  });

  it('detects devanagari as hindi', () => {
    const result = service.normalizeMessage('शादी के लिए vendor chahiye');

    expect(result.detectedLanguage).toBe('hinglish');
  });
});
