import {Hono} from 'hono';
import { streamText } from 'hono/streaming';
import OpenAI from 'openai';

// some helper functions for pinecone
import { upsertData } from '../../../lib/pinecone/seed';
import { env } from '../../../config';

const chat_stream = new Hono();
const openai = new OpenAI({
    baseURL: env.OPEN_AI_BASE_URL,
    apiKey: env.OPEN_AI_API_KEY,
});

chat_stream.post('/', (c) => {
    return streamText(c, async (stream) => {
        try {
            c.header('Content-Type', 'text/event-stream');
            c.header('Cache-Control', 'no-cache');
            c.header('Connection', 'keep-alive');
            c.header('Transfer-Encoding', 'chunked');
            const { message, is_file, files_text } = await c.req.json();

            // Check if message exists in DB
            // const isDataExist = await queryData(message as string);
            // if (
            //     isDataExist &&
            //     isDataExist?.matches[0]?.score > 0.9 &&
            //     !is_file
            // ) {
            //     console.log(['LOG -> DATA ALREADY EXIST'], isDataExist);
            //     const { answer: storedAnswer } =
            //         isDataExist.matches[0].metadata;
            //     const lines = storedAnswer.split(' ');

            //     // Stream each line in HTML format
            //     for (const line of lines) {
            //         await stream.write(`data: ${line}\n\n`);
            //     }
            //     await stream.writeln('event: close\ndata: [DONE]\n\n');
            //     return;
            // }

            // const response = await openai.chat.completions.create({
            //     messages: [
            //         {
            //             role: 'system' as const,
            //             content:
            //                 'You are a helpful assistant that responds in structured and UI-friendly HTML format. Do not give a response in plain text.',
            //         },
            //         {
            //             role: 'user' as const,
            //             content: `${
            //                 typeof message === 'string' ? message : ''
            //             }`,
            //         },
            //         ...(is_file && files_text
            //             ? [
            //                   {
            //                       role: 'user' as const,
            //                       content:
            //                           typeof files_text === 'string'
            //                               ? files_text
            //                               : '',
            //                   },
            //                   {
            //                       role: 'system' as const,
            //                       content:
            //                           'If files_text exists, use it to summarize based on the user content and respond in UI-friendly HTML format.',
            //                   },
            //               ]
            //             : []),
            //     ],
            //     model: 'deepseek-chat',
            //     stream: true,
            // });
            // console.log(response);

            // const readableStream = response.toReadableStream();
            // const reader = readableStream.getReader();
            // let answer = '';

            // // Stream HTML formatted response
            // while (true) {
            //     const { done, value } = await reader.read();
            //     if (done) {
            //         break;
            //     }
            //     const lines = new TextDecoder('utf-8')
            //         .decode(value)
            //         .split('\n')
            //         .filter((line) => line);

            //     // Process the content and send it
            //     for (const line of lines) {
            //         if (line === '[DONE]') {
            //             await stream.writeln('event: close\ndata:[DONE]\n\n');
            //             return;
            //         }

            //         const parsedData = JSON.parse(line.replace(/^data:/, ''));
            //         const content = parsedData.choices[0]?.delta?.content;

            //         // if (content) {
            //         //     const finalContent = `data:${content}`;
            //         //     console.log('CONTENT -> ', finalContent);
            //         //     await stream.write(finalContent); // Streaming each line
            //         // }
            //         const finalContent = `data:${content}`;
            //         console.log('CONTENT -> ', finalContent);
            //         await stream.writeln(finalContent); // Streaming each line
            //     }
            // }

            // new code
            // Backend code (streaming)
            const response = openai.beta.chat.completions.stream({
                messages: [
                    {
                        role: 'system' as const,
                        content:
                            'You are a helpful assistant that responds in structured and UI-friendly HTML format.',
                    },
                    {
                        role: 'user' as const,
                        content: `${
                            typeof message === 'string' ? message : ''
                        }`,
                    },
                    ...(is_file && files_text
                        ? [
                              {
                                  role: 'user' as const,
                                  content: files_text as string,
                              },
                              {
                                  role: 'system' as const,
                                  content:
                                      'If files_text exists, use it to summarize in UI-friendly HTML format.',
                              },
                          ]
                        : []),
                ],
                model: 'deepseek-chat',
                stream: true,
            });
            // response.on('content', (delta, snapshot) => {
            //     console.log(['DELTA'], delta);
            //     // write a response on stream
            //     // stream.write(`data: ${delta}\n\n`);
            // });
            const chatCompletion = await response.finalChatCompletion();
            const reader = response.toReadableStream().getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const lines = new TextDecoder('utf-8')
                    .decode(value)
                    .split('\n')
                    .filter((line) => line);
                // console.log(["LINES"], lines);
                for (const line of lines) {
                    if (line === '[DONE]') {
                        await stream.writeln('event: close\ndata:[DONE]\n\n');
                        return;
                    }

                    const parsedData = JSON.parse(line.replace(/^data:/, ''));
                    const content = parsedData.choices[0]?.delta?.content || '';

                    // Stream the cleaned content only
                    await stream.writeln(`data:${content}\n\n`);
                }
            }

            // Insert HTML formatted data into the database
            // const dataToInsert = {
            //     id: c.get('requestId'),
            //     question: typeof message === 'string' ? message : '',
            //     answer: answer, // final answer in HTML format
            // };
            // await upsertData(dataToInsert);
        } catch (error: any) {
            console.log(error);
            console.log(['MESSAGE -> '], error?.message);
            await stream.writeln(
                'data: Error: Unable to process your request.\n\n'
            );
        }
    });
});

export default chat_stream;
