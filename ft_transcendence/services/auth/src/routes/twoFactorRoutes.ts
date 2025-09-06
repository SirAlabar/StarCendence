import { FastifyInstance } from "fastify";
import { authenticateToken } from "../middleware/authMiddleware";
import * as twoFactorController from "../controllers/twoFactorController";
import * as twoFactorSchema from "../schemas/twoFactorSchema";

export async function twoFactorRoutes(fastify: FastifyInstance) {
    fastify.post('/setup',
    {
        preHandler: [authenticateToken],
        schema: twoFactorSchema.setupTwoFactorSchema
    },
    twoFactorController.setupTwoFactor);

    fastify.post('/verify',
    {
        preHandler: [authenticateToken],
        schema: twoFactorSchema.verifyTwoFactorSchema
    },
    twoFactorController.verifyTwoFactor);

    fastify.post('/disable',
    {
        preHandler: [authenticateToken],
        schema: twoFactorSchema.disableTwoFactorSchema
    },
    twoFactorController.disableTwoFactor);
}
