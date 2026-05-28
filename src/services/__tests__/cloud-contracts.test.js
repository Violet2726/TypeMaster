import {
    sessionSyncGateway,
    challengeGateway
} from '../cloud-contracts';

describe('cloud-contracts', () => {
    describe('exported instances', () => {
        test('sessionSyncGateway.syncSession throws error', async () => {
            await expect(sessionSyncGateway.syncSession()).rejects.toThrow();
        });

        test('challengeGateway.createChallenge throws error', async () => {
            await expect(challengeGateway.createChallenge()).rejects.toThrow();
        });
    });
});
