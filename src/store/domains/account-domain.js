export function buildAccountDomain({
    account,
    accountStatus,
    signInToCloud,
    signOutFromCloud,
    exportTrainingData,
    importTrainingData,
    challengeGateway,
    sessionSyncGateway
}) {
    return {
        account,
        accountStatus,
        signInToCloud,
        signOutFromCloud,
        exportTrainingData,
        importTrainingData,
        challengeGateway,
        sessionSyncGateway
    };
}
