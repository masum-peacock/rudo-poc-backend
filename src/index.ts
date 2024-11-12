import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';



// prisma db connection import
import { Env } from './lib/prisma/index';

// import routes
import chat from './api/v1/routes/chat'
import chat_stream from './api/v1/routes/chat-stream';
import vector_routes from './api/v1/routes/get-vectors';

// app instance
const app = new Hono<{ Bindings: Env }>();

// register middleware
app.use(logger());
app.use(cors({ origin: '*' }));

app.use('*', requestId());

// register cache for every get routes
// app.get(
//     '*',
//     cache({
//         cacheName: 'rudo-cache',
//         cacheControl: 'max-age=36000',
//     })
// );

// default route
app.get('/', (c) => {
    return c.json({
        id: c.get('requestId'),
        success: true,
        message: 'Hello Hono! 👋',
    });
});

app.route('/chat', chat);
app.route('/chat-stream', chat_stream);
app.route('/get-vectors', vector_routes);

export default app;
