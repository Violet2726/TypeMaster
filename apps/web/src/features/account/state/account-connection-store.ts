import { create } from 'zustand';

type AccountConnectionState = {
    accountStatus: AccountStatus,
    setAccountStatus: (next: AccountStatus) => void,
};

export type AccountStatus = 'idle' | 'loading' | 'connected' | 'error';

export const useAccountConnectionStore = create<AccountConnectionState>((set) => ({
    accountStatus: 'idle',
    setAccountStatus: (next) => set({
        accountStatus: next
    })
}));
