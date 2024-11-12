import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { DefaultArgs } from '@prisma/client/runtime/library';

export interface Env {
    DB: D1Database;
}
let prisma = null;
export default {
    fetch(env: Env): PrismaClient<
        {
            adapter: PrismaD1;
        },
        never,
        DefaultArgs
    > {
        if (!prisma) {
            const adapter = new PrismaD1(env.DB);
            return new PrismaClient({ adapter });
        }
        return prisma;
    },
};
