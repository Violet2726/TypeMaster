import { describe, it, expect } from 'vitest';
import { buildRenderedWords } from '../rendering';

describe('rendering', () => {
    describe('buildRenderedWords', () => {
        it('should render all words as past when currentWordIndex is beyond all words', () => {
            const words = ['hello', 'world'];
            const rendered = buildRenderedWords(words, [], '', 10);

            expect(rendered).toHaveLength(2);
            expect(rendered[0].phase).toBe('past');
            expect(rendered[1].phase).toBe('past');
        });

        it('should render all words as past when currentWordIndex equals word count', () => {
            const words = ['hello', 'world'];
            const rendered = buildRenderedWords(words, ['hello', 'world'], '', 2);

            expect(rendered).toHaveLength(2);
            expect(rendered[0].phase).toBe('past');
            expect(rendered[1].phase).toBe('past');
        });

        it('should render words before currentWordIndex as past', () => {
            const words = ['hello', 'world', 'test'];
            const rendered = buildRenderedWords(words, ['hello'], '', 1);

            expect(rendered[0].phase).toBe('past');
            expect(rendered[1].phase).toBe('current');
            expect(rendered[2].phase).toBe('future');
        });

        it('should render current word correctly', () => {
            const words = ['hello'];
            const rendered = buildRenderedWords(words, [], 'h', 0);

            expect(rendered[0].phase).toBe('current');
            expect(rendered[0].isCurrent).toBe(true);
        });

        it('should render future words correctly', () => {
            const words = ['hello', 'world'];
            const rendered = buildRenderedWords(words, [], '', 0);

            expect(rendered[0].phase).toBe('current');
            expect(rendered[1].phase).toBe('future');
        });

        it('should include wordIndex in each rendered word', () => {
            const words = ['hello', 'world', 'test'];
            const rendered = buildRenderedWords(words, [], '', 1);

            expect(rendered[0].wordIndex).toBe(0);
            expect(rendered[1].wordIndex).toBe(1);
            expect(rendered[2].wordIndex).toBe(2);
        });

        it('should include word text in each rendered word', () => {
            const words = ['hello', 'world'];
            const rendered = buildRenderedWords(words, [], '', 0);

            expect(rendered[0].word).toBe('hello');
            expect(rendered[1].word).toBe('world');
        });

        it('should handle empty typedHistory', () => {
            const words = ['hello'];
            const rendered = buildRenderedWords(words, [], '', 0);

            expect(rendered[0].chars).toBeDefined();
            expect(Array.isArray(rendered[0].chars)).toBe(true);
        });

        it('should handle typedHistory shorter than words', () => {
            const words = ['hello', 'world'];
            const rendered = buildRenderedWords(words, ['hello'], '', 1);

            expect(rendered[0].phase).toBe('past');
            expect(rendered[1].phase).toBe('current');
        });

        it('should handle empty words array', () => {
            const rendered = buildRenderedWords([], [], '', 0);

            expect(rendered).toHaveLength(0);
        });

        it('should handle currentInput longer than current word', () => {
            const words = ['hi'];
            const rendered = buildRenderedWords(words, [], 'hello', 0);

            expect(rendered[0].phase).toBe('current');
            expect(rendered[0].extraChars).toBeDefined();
            expect(rendered[0].extraChars.length).toBeGreaterThan(0);
        });

        it('should render past word chars with correct status', () => {
            const words = ['abc'];
            const rendered = buildRenderedWords(words, ['abc'], '', 1);

            expect(rendered[0].phase).toBe('past');
            expect(rendered[0].chars[0].char).toBe('a');
            expect(rendered[0].chars[0].status).toBe('correct');
        });

        it('should render past word with incorrect chars', () => {
            const words = ['abc'];
            const rendered = buildRenderedWords(words, ['xyz'], '', 1);

            expect(rendered[0].phase).toBe('past');
            expect(rendered[0].chars[0].status).toBe('incorrect');
            expect(rendered[0].chars[1].status).toBe('incorrect');
            expect(rendered[0].chars[2].status).toBe('incorrect');
        });

        it('should render past word with missed chars when typedHistory is shorter', () => {
            const words = ['abc'];
            const rendered = buildRenderedWords(words, ['a'], '', 1);

            expect(rendered[0].phase).toBe('past');
            expect(rendered[0].chars[0].status).toBe('correct');
            expect(rendered[0].chars[1].status).toBe('missed');
            expect(rendered[0].chars[2].status).toBe('missed');
        });

        it('should render current word with pending status for untyped chars', () => {
            const words = ['abc'];
            const rendered = buildRenderedWords(words, [], '', 0);

            expect(rendered[0].phase).toBe('current');
            expect(rendered[0].chars[0].status).toBe('pending-current');
            expect(rendered[0].chars[1].status).toBe('pending-current');
            expect(rendered[0].chars[2].status).toBe('pending-current');
        });

        it('should render current word with correct status for typed chars', () => {
            const words = ['abc'];
            const rendered = buildRenderedWords(words, [], 'ab', 0);

            expect(rendered[0].chars[0].status).toBe('correct');
            expect(rendered[0].chars[1].status).toBe('correct');
            expect(rendered[0].chars[2].status).toBe('pending-current');
        });

        it('should render current word with incorrect status for wrong chars', () => {
            const words = ['abc'];
            const rendered = buildRenderedWords(words, [], 'axy', 0);

            expect(rendered[0].chars[0].status).toBe('correct');
            expect(rendered[0].chars[1].status).toBe('incorrect');
            expect(rendered[0].chars[2].status).toBe('incorrect');
        });

        it('should render future word with pending-future status', () => {
            const words = ['abc'];
            const rendered = buildRenderedWords(words, [], '', 0);

            expect(rendered[0].phase).toBe('current');
        });

        it('should render word after current as future', () => {
            const words = ['hello', 'world'];
            const rendered = buildRenderedWords(words, [], '', 0);

            expect(rendered[1].phase).toBe('future');
            expect(rendered[1].chars[0].status).toBe('pending-future');
        });

        it('should include char index in each char object', () => {
            const words = ['abc'];
            const rendered = buildRenderedWords(words, [], 'a', 0);

            expect(rendered[0].chars[0].index).toBe(0);
            expect(rendered[0].chars[1].index).toBe(1);
            expect(rendered[0].chars[2].index).toBe(2);
        });

        it('should handle multi-word typedHistory with extra chars', () => {
            const words = ['ab', 'cd'];
            const rendered = buildRenderedWords(words, ['abx', 'cd'], '', 2);

            expect(rendered[0].phase).toBe('past');
            expect(rendered[0].extraChars.length).toBeGreaterThan(0);
        });

        it('should handle typedHistory with more words than words array', () => {
            const words = ['ab'];
            const rendered = buildRenderedWords(words, ['ab', 'cd', 'ef'], '', 1);

            expect(rendered[0].phase).toBe('past');
        });

        it('should handle empty currentInput', () => {
            const words = ['hello'];
            const rendered = buildRenderedWords(words, [], '', 0);

            expect(rendered[0].phase).toBe('current');
            expect(rendered[0].chars.every(c => c.status === 'pending-current')).toBe(true);
        });

        it('should mark current word correctly', () => {
            const words = ['a', 'b', 'c'];
            const rendered = buildRenderedWords(words, [], '', 1);

            expect(rendered[0].isCurrent).toBe(false);
            expect(rendered[1].isCurrent).toBe(true);
            expect(rendered[2].isCurrent).toBe(false);
        });
    });
});
