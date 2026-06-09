import { API_BASE, REMOTE_API_FLAG } from '@typemaster/contracts';
import { getCurrentUserRecord, readApiFallbackCache } from './local-cache';

type SchemaLike<T = unknown> = {
    parse: (value: unknown) => T;
};

type RequestJsonOptions<TRequest = unknown, TResponse = unknown> = {
    body?: TRequest;
    headers?: Record<string, string>;
    method?: string;
    requestSchema?: SchemaLike<TRequest>;
    responseSchema?: SchemaLike<TResponse>;
};

function getAuthorizationHeader() {
    const record = getCurrentUserRecord(readApiFallbackCache());
    if (!record?.id) {
        return {};
    }

    return {
        Authorization: `Bearer typemaster-local:${encodeURIComponent(record.id)}`
    };
}

export function shouldUseRemoteApi() {
    const nextFlag = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_TYPEMASTER_REMOTE_API : undefined;

    return nextFlag === REMOTE_API_FLAG;
}

export async function requestJson<TResponse = unknown, TRequest = unknown>(
    pathname: string,
    options: RequestJsonOptions<TRequest, TResponse> = {}
) {
    if (!shouldUseRemoteApi()) {
        throw new Error('remote api disabled');
    }

    if (typeof fetch !== 'function') {
        throw new Error('fetch unavailable');
    }

    const parsedRequestBody = options.requestSchema
        ? options.requestSchema.parse(options.body ?? {})
        : options.body;

    const response = await fetch(`${API_BASE}${pathname}`, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthorizationHeader(),
            ...(options.headers || {})
        },
        body: parsedRequestBody ? JSON.stringify(parsedRequestBody) : undefined
    });

    if (!response.ok) {
        throw new Error(`api request failed: ${response.status}`);
    }

    const payload = await response.json();
    return options.responseSchema ? options.responseSchema.parse(payload) : payload;
}
