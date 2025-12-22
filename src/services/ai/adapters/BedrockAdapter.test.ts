import { describe, expect, it, vi } from 'vitest';
import { BedrockAdapter } from './BedrockAdapter';

// Mock fetch
global.fetch = vi.fn();

describe('BedrockAdapter', () => {
    it('should be defined', () => {
        const adapter = new BedrockAdapter();
        expect(adapter).toBeDefined();
    });

    describe('validateApiKey', () => {
        it('should return true for valid key', async () => {
            const adapter = new BedrockAdapter();
            const isValid = await adapter.validateApiKey('test-key');
            expect(isValid).toBe(true);
        });

        it('should return false for empty key', async () => {
            const adapter = new BedrockAdapter();
            const isValid = await adapter.validateApiKey('');
            expect(isValid).toBe(false);
        });
    });

    // Note: Testing streamMessage binary parsing requires constructing complex Uint8Array mocks
    // For this initial pass, we verify the class structure and basic validation.
});
