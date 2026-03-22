/**
 * 云端接口契约占位层。
 *
 * 本版本还没有真正的云端同步和挑战后端，
 * 但先把客户端调用边界定义出来，这样未来接 API 时
 * 不需要回过头去重写业务页面。
 */

/**
 * 明确告诉调用方：当前接口只是约定，尚未实现。
 */
class NotImplementedGatewayError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotImplementedGatewayError';
    }
}

/**
 * 会话同步接口占位。
 */
export class SessionSyncGateway {
    async syncSession() {
        throw new NotImplementedGatewayError('Session sync gateway is not implemented in v2 slice 1.');
    }
}

/**
 * 挑战模式接口占位。
 */
export class ChallengeGateway {
    async createChallenge() {
        throw new NotImplementedGatewayError('Challenge gateway is not implemented in v2 slice 1.');
    }
}

export const sessionSyncGateway = new SessionSyncGateway();
export const challengeGateway = new ChallengeGateway();
