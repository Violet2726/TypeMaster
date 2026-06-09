import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DEFAULT_DAILY_CHALLENGE_CONFIG } from './index.js';
import { TrainingDataBundleSchema } from './storage.js';
import {
    AchievementSchema,
    CoachAdviceContentSchema,
    CoachAdviceRecordSchema,
    NormalizedTrainingConfigSchema,
    SessionRecordSchema,
    SkillProfileSchema,
    StreakStateSchema,
    TrainingPlanSchema
} from './training-state.js';

export const ChallengeAttemptResultSchema = z.object({
    wpm: z.number().optional(),
    accuracy: z.number().optional()
}).catchall(z.unknown());

export const ChallengeEntrySchema = z.object({
    id: z.string(),
    challengeId: z.string(),
    userId: z.string().nullable(),
    displayName: z.string(),
    levelId: z.string().nullable(),
    sessionId: z.string(),
    wpm: z.number(),
    accuracy: z.number(),
    createdAt: z.string()
});

export const DailyChallengeConfigSchema = NormalizedTrainingConfigSchema;

export const DailyChallengeSchema = z.object({
    id: z.string(),
    dateKey: z.string(),
    title: z.string(),
    summary: z.string(),
    text: z.string(),
    config: DailyChallengeConfigSchema,
    leaderboard: z.array(ChallengeEntrySchema)
});

export const AccountRecordSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    createdAt: z.string(),
    lastSyncedAt: z.string().nullable(),
    sessions: z.array(SessionRecordSchema),
    trainingPlan: TrainingPlanSchema.nullable(),
    skillProfile: SkillProfileSchema.nullable(),
    achievements: z.array(AchievementSchema),
    streakState: StreakStateSchema.nullable(),
    coachAdvices: z.array(CoachAdviceRecordSchema).optional().default([]),
    userProfile: z.object({
        displayName: z.string()
    }).catchall(z.unknown()),
    challengeResults: z.record(ChallengeEntrySchema)
}).catchall(z.unknown());

export const ErrorResponseSchema = z.object({
    error: z.string()
});

export const PracticeTextRequestSchema = z.object({
    config: NormalizedTrainingConfigSchema,
    promptOverride: z.string().optional().default(''),
    language: z.string().optional().default('zh-CN')
}).passthrough();

export const PracticeTextResponseSchema = z.object({
    text: z.string()
});

export const CoachAdviceRequestSchema = z.object({
    session: SessionRecordSchema,
    history: z.array(SessionRecordSchema).optional().default([]),
    language: z.string().optional().default('zh-CN')
}).passthrough();

export const CoachAdviceResponseSchema = z.object({
    advice: CoachAdviceContentSchema
});

export const CurrentUserResponseSchema = z.object({
    user: AccountRecordSchema.nullable()
});

export const SignInRequestSchema = z.object({
    displayName: z.string()
}).passthrough();

export const SignInResponseSchema = z.object({
    user: AccountRecordSchema
});

export const SessionsResponseSchema = z.object({
    sessions: z.array(SessionRecordSchema)
});

export const saveSessionRequestSchema = z.object({
    session: SessionRecordSchema
}).passthrough();

export const TrainingPlanResponseSchema = z.object({
    trainingPlan: TrainingPlanSchema.nullable()
});

export const saveTrainingPlanRequestSchema = z.object({
    trainingPlan: TrainingPlanSchema.nullable().optional().default(null)
}).passthrough();

export const SkillProfileResponseSchema = z.object({
    skillProfile: SkillProfileSchema.nullable(),
    achievements: z.array(AchievementSchema),
    streakState: StreakStateSchema.nullable()
});

export const saveSkillProfileRequestSchema = z.object({
    skillProfile: SkillProfileSchema.nullable().optional().default(null),
    achievements: z.array(AchievementSchema).optional().default([]),
    streakState: StreakStateSchema.nullable().optional().default(null)
}).passthrough();

export const DailyChallengeResponseSchema = z.object({
    challenge: DailyChallengeSchema
});

export const ChallengeLeaderboardResponseSchema = z.object({
    leaderboard: z.array(ChallengeEntrySchema)
});

export const SubmitChallengeResultRequestSchema = z.object({
    challengeId: z.string(),
    displayName: z.string().optional(),
    sessionId: z.string(),
    result: ChallengeAttemptResultSchema.optional().default({})
}).passthrough();

export const SubmitChallengeResultResponseSchema = z.object({
    entry: ChallengeEntrySchema
});

export const CoachAdviceRecordResponseSchema = z.object({
    coachAdvice: CoachAdviceRecordSchema.nullable()
});

export const CoachAdviceListResponseSchema = z.object({
    coachAdvices: z.array(CoachAdviceRecordSchema)
});

export const ExportTrainingDataResponseSchema = z.object({
    bundle: TrainingDataBundleSchema
});

export const ImportTrainingDataRequestSchema = z.object({
    bundle: TrainingDataBundleSchema
}).passthrough();

export const ImportTrainingDataResponseSchema = z.object({
    bundle: TrainingDataBundleSchema
});

export const DEFAULT_API_INFO = {
    title: 'TypeMaster API',
    version: '2.0.0'
};

export const API_OPERATION_SPECS = {
    '/api/practice-text': {
        post: {
            summary: 'Generate typing practice text',
            requestBodySchema: PracticeTextRequestSchema,
            requestBodyRequired: true,
            responses: {
                200: {
                    description: 'Generated practice text',
                    schema: PracticeTextResponseSchema
                },
                400: {
                    description: 'Invalid practice text request',
                    schema: ErrorResponseSchema
                },
                500: {
                    description: 'Missing AI configuration or provider failure',
                    schema: ErrorResponseSchema
                }
            }
        }
    },
    '/api/coach': {
        post: {
            summary: 'Generate coaching feedback for a session',
            requestBodySchema: CoachAdviceRequestSchema,
            requestBodyRequired: true,
            responses: {
                200: {
                    description: 'Generated coach advice',
                    schema: CoachAdviceResponseSchema
                },
                400: {
                    description: 'Invalid coach request',
                    schema: ErrorResponseSchema
                },
                500: {
                    description: 'Missing AI configuration or provider failure',
                    schema: ErrorResponseSchema
                }
            }
        }
    },
    '/api/coach-feedback': {
        get: {
            summary: 'Read persisted coaching feedback records',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Persisted coach feedback records',
                    schema: CoachAdviceListResponseSchema
                }
            }
        }
    },
    '/api/exports': {
        get: {
            summary: 'Export a versioned training data bundle',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Versioned training data bundle',
                    schema: ExportTrainingDataResponseSchema
                }
            }
        },
        post: {
            summary: 'Import a versioned training data bundle',
            requestBodySchema: ImportTrainingDataRequestSchema,
            requestBodyRequired: true,
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Imported training data bundle',
                    schema: ImportTrainingDataResponseSchema
                },
                400: {
                    description: 'Invalid import payload',
                    schema: ErrorResponseSchema
                }
            }
        }
    },
    '/api/me': {
        get: {
            summary: 'Get the current user',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Current user snapshot',
                    schema: CurrentUserResponseSchema
                }
            }
        }
    },
    '/api/auth/sign-in': {
        post: {
            summary: 'Create or restore a user',
            requestBodySchema: SignInRequestSchema,
            requestBodyRequired: true,
            responses: {
                200: {
                    description: 'Normalized user record',
                    schema: SignInResponseSchema
                },
                400: {
                    description: 'Invalid display name',
                    schema: ErrorResponseSchema
                }
            }
        }
    },
    '/api/sessions': {
        get: {
            summary: 'Read synced session history',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Session list',
                    schema: SessionsResponseSchema
                }
            }
        },
        post: {
            summary: 'Sync one session record',
            requestBodySchema: saveSessionRequestSchema,
            requestBodyRequired: true,
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Updated session list',
                    schema: SessionsResponseSchema
                },
                400: {
                    description: 'Invalid payload',
                    schema: ErrorResponseSchema
                }
            }
        }
    },
    '/api/plans': {
        get: {
            summary: 'Read the training plan snapshot',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Training plan snapshot',
                    schema: TrainingPlanResponseSchema
                }
            }
        },
        post: {
            summary: 'Sync the training plan snapshot',
            requestBodySchema: saveTrainingPlanRequestSchema,
            requestBodyRequired: true,
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Updated training plan snapshot',
                    schema: TrainingPlanResponseSchema
                },
                400: {
                    description: 'Invalid payload',
                    schema: ErrorResponseSchema
                }
            }
        }
    },
    '/api/profiles': {
        get: {
            summary: 'Read the skill profile snapshot',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Skill profile snapshot',
                    schema: SkillProfileResponseSchema
                }
            }
        },
        post: {
            summary: 'Sync the skill profile snapshot',
            requestBodySchema: saveSkillProfileRequestSchema,
            requestBodyRequired: true,
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Updated skill profile snapshot',
                    schema: SkillProfileResponseSchema
                },
                400: {
                    description: 'Invalid payload',
                    schema: ErrorResponseSchema
                }
            }
        }
    },
    '/api/challenges/daily': {
        get: {
            summary: 'Read the daily challenge snapshot',
            responses: {
                200: {
                    description: 'Daily challenge snapshot',
                    schema: DailyChallengeResponseSchema
                }
            }
        }
    },
    '/api/challenge-attempts': {
        post: {
            summary: 'Submit one challenge result',
            requestBodySchema: SubmitChallengeResultRequestSchema,
            requestBodyRequired: true,
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Challenge leaderboard entry',
                    schema: SubmitChallengeResultResponseSchema
                },
                400: {
                    description: 'Invalid payload',
                    schema: ErrorResponseSchema
                }
            }
        }
    },
    '/api/leaderboards/challenge': {
        get: {
            summary: 'Read the challenge leaderboard',
            responses: {
                200: {
                    description: 'Challenge leaderboard entries',
                    schema: ChallengeLeaderboardResponseSchema
                }
            }
        }
    }
};

export function getDefaultDailyChallengeConfigSchema() {
    return DailyChallengeConfigSchema.parse(DEFAULT_DAILY_CHALLENGE_CONFIG);
}

function createInlineJsonSchema(name, schema) {
    const document = zodToJsonSchema(schema, name);
    return document.definitions?.[name] || document.$defs?.[name] || document;
}

function createJsonResponse(specName, statusCode, responseSpec) {
    return {
        description: responseSpec.description,
        content: {
            'application/json': {
                schema: createInlineJsonSchema(`${specName}${statusCode}Response`, responseSpec.schema)
            }
        }
    };
}

function createOperation(specName, operationSpec) {
    const operation = {
        summary: operationSpec.summary,
        responses: Object.fromEntries(
            Object.entries(operationSpec.responses).map(([statusCode, responseSpec]) => [
                statusCode,
                createJsonResponse(specName, statusCode, responseSpec)
            ])
        )
    };

    if (operationSpec.requestBodySchema) {
        operation.requestBody = {
            required: operationSpec.requestBodyRequired !== false,
            content: {
                'application/json': {
                    schema: createInlineJsonSchema(`${specName}Request`, operationSpec.requestBodySchema)
                }
            }
        };
    }

    if (operationSpec.security) {
        operation.security = operationSpec.security;
    }

    return operation;
}

export function createApiOpenApiDocument(info = DEFAULT_API_INFO) {
    const paths = {};

    Object.entries(API_OPERATION_SPECS).forEach(([path, pathSpec]) => {
        const normalizedName = path
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim()
            .split(/\s+/)
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join('');

        paths[path] = Object.fromEntries(
            Object.entries(pathSpec).map(([method, operationSpec]) => [
                method,
                createOperation(`${normalizedName}${method.toUpperCase()}`, operationSpec)
            ])
        );
    });

    return {
        openapi: '3.0.3',
        info,
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        paths
    };
}
