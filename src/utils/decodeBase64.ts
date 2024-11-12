import { PineconeRecord } from '@pinecone-database/pinecone';

export const decodeBase64 = (base64String: string) => {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return Array.from(bytes);
};
