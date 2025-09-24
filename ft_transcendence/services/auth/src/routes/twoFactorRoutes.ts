import { FastifyInstance } from "fastify";
import { verifyUserToken } from "../middleware/authMiddleware";
import * as twoFactorController from "../controllers/twoFactorController";
import * as twoFactorSchema from "../schemas/twoFactorSchema";

export async function twoFactorRoutes(fastify: FastifyInstance) {
    fastify.post('/setup',
    {
        preHandler: [verifyUserToken],
        schema: twoFactorSchema.setupTwoFactorSchema
    },
    twoFactorController.setupTwoFactor);

    fastify.post('/verify',
    {
        preHandler: [verifyUserToken],
        schema: twoFactorSchema.verifyTwoFactorSchema
    },
    twoFactorController.verifyTwoFactor);

    fastify.post('/disable',
    {
        preHandler: [verifyUserToken],
        schema: twoFactorSchema.disableTwoFactorSchema
    },
    twoFactorController.disableTwoFactor);
}
