import { indexName, pc, index as pIndex } from '.';
import { decodeBase64 } from '../../utils';

const model = 'multilingual-e5-large';
const data = [
    {
        id: 'vec8',
        text: 'Apple is a popular fruit known for its sweetness and crisp texture.',
    },
    {
        id: 'vec7',
        text: 'The tech company Apple is known for its innovative products like the iPhone.',
    },
    { id: 'vec3', text: 'Many people enjoy eating apples as a healthy snack.' },
    {
        id: 'vec4',
        text: 'Apple Inc. has revolutionized the tech industry with its sleek designs and user-friendly interfaces.',
    },
    {
        id: 'vec5',
        text: 'An apple a day keeps the doctor away, as the saying goes.',
    },
    {
        id: 'vec6',
        text: 'Apple Computer Company was founded on April 1, 1976, by Steve Jobs, Steve Wozniak, and Ronald Wayne as a partnership.',
    },
];

export const upsertData = async ({
    question,
    answer,
    id,
    user_id,
}: {
    question: string;
    answer: string;
    id: string;
    user_id: string;
}) => {
    try {
        const embeddings = await pc.inference.embed(model, [question], {
            inputType: 'passage',
            truncate: 'END',
        });
        const records = [
            {
                id: id,
                values: embeddings[0].values!,
                metadata: { answer: answer, user_id },
            },
        ];
        const result = await pIndex.namespace(indexName).upsert(records);
        console.log('Success to add data in vector db');
        return 'success';
    } catch (error: any) {
        console.log(['INSERT ERROR'], error);
        return error?.message;
    }
};

export const queryData = async (search: string = '', user_id?: string) => {
    try {
        console.log('FUNCTION IS CALLING...');
        const query = [search];
        const embeddings = await pc.inference.embed(model, query, {
            inputType: 'passage',
            truncate: 'END',
        });

        const queryResponse = await pIndex.namespace(model).query({
            topK: 1,
            vector: embeddings[0].values!,
            includeValues: true,
            includeMetadata: true,
            ...(user_id ? { filter: { "user_id": { "$eq": user_id } } } : {})
        });
        console.log(['Response'], queryResponse);
        if (queryResponse) return queryResponse;
        console.log('not found');
        return null;
    } catch (error) {
        console.log(error);
        throw new Error('Failed to load vector data');
    }
};

export const retrieveRelevantContext = async ({
    userID: user_id,
    search,
}: {
    userID: string;
    search: string;
}) => {
    try {
        // Step 1: Use a dummy vector for the query; ideally, this should be the same dimensionality as your index
        const query = [search];
        const embeddings = await pc.inference.embed(model, query, {
            inputType: 'passage',
            truncate: 'END',
        });
        console.log(['embeddings'], embeddings[0].values);
        // const fetchData = await pIndex.fetch([''])
        // console.log(["FETCHED DATA"], fetchData);
        // Step 2: Query Pinecone with the dummy vector and include metadata filtering
        const queryResponse = await pIndex.namespace(model).query({
            topK: 10,
            vector: embeddings[0].values!,
            includeValues: false, // Exclude the raw embedding values
            includeMetadata: true,
            filter: {
                "user_id": {
                    "$eq": user_id
                }
            } 
        });

        // Step 3: Check if matches were found, filter by user_id, and format the context
        if (queryResponse?.matches?.length) {
            const messages = queryResponse.matches
                .filter((match) => match.metadata?.user_id === user_id) // Additional filtering by user_id
                .map((match) => match.metadata?.text || '')
                // @ts-ignore
                .filter((text) => text?.length > 0)
                .join('\n\n');

            return {
                success: true,
                messages,
            };
        }

        // Return an empty success response if no matches found
        return {
            success: true,
            messages: '',
        };
    } catch (error: any) {
        console.error('Error retrieving context from Pinecone:', error);
        return {
            success: false,
            messages: '',
            error: error.message || 'An unknown error occurred.',
        };
    }
};
