import { AuthGateway } from './auth-gateway';
import { ChallengeGateway } from './challenge-gateway';
import { PlanGateway } from './plan-gateway';
import { SessionGateway } from './session-gateway';

export { AuthGateway } from './auth-gateway';
export { ChallengeGateway } from './challenge-gateway';
export { PlanGateway } from './plan-gateway';
export { SessionGateway } from './session-gateway';

export const authGateway = new AuthGateway();
export const sessionGateway = new SessionGateway();
export const planGateway = new PlanGateway();
export const challengeGateway = new ChallengeGateway();
