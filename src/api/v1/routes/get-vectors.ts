import { Hono } from 'hono';
import { retrieveRelevantContext } from '../../../lib/pinecone/seed';

const vector_routes = new Hono();
vector_routes.get('/', async (c) => {
    try {
        const { search, user_id } = c.req.query();
        const data = await retrieveRelevantContext({
            search: search,
            userID: user_id,
        });
        return c.json({
            id: c.get('requestId'),
            success: true,
            message: 'Hello Hono!',
            data: data,
        });
    } catch (error) {
        console.log(['GET VECTOR ERROR -> '], error);
        return c.json({
            id: c.get('requestId'),
            success: false,
            message: error,
        });
    }
});

export default vector_routes;
