import { buildProviderPayload } from '../lib/ai-provider';

describe('ai-provider', () => {
    test('builds a safe payload from partial input', () => {
        const payload = buildProviderPayload({
            messages: [{ role: 'user', content: 'hello' }],
            temperature: 0.4
        });

        expect(payload).toEqual({
            model: 'glm-4-flash',
            messages: [{ role: 'user', content: 'hello' }],
            stream: false,
            max_tokens: 4096,
            temperature: 0.4
        });
    });

    test('keeps response_format when provided', () => {
        const payload = buildProviderPayload({
            model: 'custom-model',
            stream: false,
            max_tokens: 100,
            temperature: 0.2,
            messages: [],
            response_format: { type: 'json_object' }
        });

        expect(payload).toEqual({
            model: 'custom-model',
            messages: [],
            stream: false,
            max_tokens: 100,
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });
    });
});
