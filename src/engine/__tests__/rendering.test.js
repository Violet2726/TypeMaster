import { buildRenderedWords } from '../rendering';

describe('rendering', () => {
    describe('buildRenderedWords', () => {
        test('renders past words correctly', () => {
            const words = ['hello', 'world', 'foo'];
            const typedHistory = ['hello', 'wrld'];
            const currentInput = '';
            const currentWordIndex = 2;
            const result = buildRenderedWords(words, typedHistory, currentInput, currentWordIndex);
            expect(result[0].phase).toBe('past');
            expect(result[0].chars.every(c => c.status === 'correct')).toBe(true);
            expect(result[1].phase).toBe('past');
            expect(result[1].chars[0].status).toBe('correct');
            expect(result[1].chars[1].status).toBe('incorrect');
        });

        test('renders current word correctly', () => {
            const words = ['hello', 'world'];
            const typedHistory = ['hello'];
            const currentInput = 'wor';
            const currentWordIndex = 1;
            const result = buildRenderedWords(words, typedHistory, currentInput, currentWordIndex);
            expect(result[1].phase).toBe('current');
            expect(result[1].isCurrent).toBe(true);
            expect(result[1].chars[0].status).toBe('correct');
            expect(result[1].chars[1].status).toBe('correct');
            expect(result[1].chars[2].status).toBe('correct');
            expect(result[1].chars[3].status).toBe('pending-current');
        });

        test('renders future words correctly', () => {
            const words = ['hello', 'world', 'foo'];
            const typedHistory = [];
            const currentInput = '';
            const currentWordIndex = 0;
            const result = buildRenderedWords(words, typedHistory, currentInput, currentWordIndex);
            expect(result[2].phase).toBe('future');
            expect(result[2].chars.every(c => c.status === 'pending-future')).toBe(true);
        });

        test('handles extra characters in current word', () => {
            const words = ['hello'];
            const typedHistory = [];
            const currentInput = 'helloo';
            const currentWordIndex = 0;
            const result = buildRenderedWords(words, typedHistory, currentInput, currentWordIndex);
            expect(result[0].extraChars.length).toBe(1);
            expect(result[0].extraChars[0].status).toBe('extra');
        });

        test('handles extra characters in past words', () => {
            const words = ['hello'];
            const typedHistory = ['helloo'];
            const currentInput = '';
            const currentWordIndex = 1;
            const result = buildRenderedWords(words, typedHistory, currentInput, currentWordIndex);
            expect(result[0].extraChars.length).toBe(1);
            expect(result[0].extraChars[0].status).toBe('extra');
        });
    });
});
