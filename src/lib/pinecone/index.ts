import {
    Pinecone,
    type PineconeConfiguration,
} from '@pinecone-database/pinecone';

import { env } from '../../config';

const config: PineconeConfiguration = {
    apiKey: env.RUDO_AI_POC,
};

export const indexName = 'multilingual-e5-large';
export const pc = new Pinecone(config);
export const index = pc.index('multilingual-e5-large');

