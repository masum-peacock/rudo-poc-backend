import { Hono } from 'hono';
import OpenAI from 'openai';

// some helper functions for pinecone
import { upsertData } from '../../../lib/pinecone/seed';
import { env } from '../../../config';

// app instance
const chat = new Hono();

// openai instance
const openai = new OpenAI({
    baseURL: env.OPEN_AI_BASE_URL,
    apiKey: env.OPEN_AI_API_KEY,
});


chat.post('/', async (c) => {
    try {
        const { user_id, message, is_file, files_text, chat_id } =
            await c.req.json();

        // Step 1: Check if message exists in DB
        // const isDataExist = await queryData(message as string);
        // if (isDataExist && isDataExist?.matches[0]?.score > 0.9 && !is_file) {
        //     console.log(['LOG -> DATA ALREADY EXIST'], isDataExist);
        //     const { answer: storedAnswer } = isDataExist.matches[0].metadata;
        //     return c.json({
        //         success: true,
        //         message: 'Chat completed successfully',
        //         data: {
        //             answer: storedAnswer,
        //         },
        //     });
        // }

        // Step 2: Generate the chat completion
        const response = openai.beta.chat.completions.stream({
            messages: [
                {
                    role: 'system' as const,
                    content:
                        'You are a helpful assistant that responds in structured and UI-friendly HTML format.',
                },
                {
                    role: 'user' as const,
                    content: `${typeof message === 'string' ? message : ''}`,
                },
                ...(files_text
                    ? [
                          {
                              role: 'system' as const,
                              content:
                                  'If files_text exists and user messages not related with file text then ignore the files_text and give a proper response in UI-friendly HTML format. and highlight the asking data using proper css',
                          },
                          {
                              role: 'system' as const,
                              content:
                                  'If files_text exists, use it to summarize and give a proper response in UI-friendly HTML format. and highlight the asking data using proper css',
                          },
                          {
                              role: 'user' as const,
                              content: files_text as string,
                          },
                      ]
                    : []),
            ],
            model: 'deepseek-chat',
            stream: true,
        });
        const chatCompletion = await response.finalChatCompletion();
        const content = chatCompletion.choices[0].message.content;

        // Step 3: Insert data data into the database
        const dataToInsert = {
            id: c.get('requestId'),
            question: typeof message === 'string' ? message : '',
            answer: content ?? '',
            user_id: user_id,
        };
        await upsertData(dataToInsert);

        // Step 4: insert data into prisma db
        // const prisma = db.fetch(c.env);
        // if (chat_id) {
        //     prisma.tbl_conversation.create({
        //         data: {
        //             chat_id: chat_id,
        //             answer: content ?? '',
        //             questions: message,
        //             files: 'TRUE',
        //             user_id: user_id,
        //         },
        //     });
        // } else {
        //     prisma.tbl_user_chat.create({
        //         data: {
        //             user_id: user_id,
        //             conversations: {
        //                 create: {
        //                     answer: content ?? '',
        //                     questions: message,
        //                     files: 'TRUE',
        //                     user_id: user_id,
        //                 },
        //             },
        //         },
        //     });
        // }

        return c.json({
            success: true,
            message: 'Chat completed successfully',
            data: {
                answer: content,
            },
        });
    } catch (error: any) {
        console.log(error);
        console.log(['MESSAGE -> '], error?.message);
        c.json(
            {
                success: false,
                message: 'INTERNAL SERVER ERROR',
            },
            500
        );
    }
});


export default chat;