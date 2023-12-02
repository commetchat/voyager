import { Router } from 'itty-router';
import { Env } from '.';
import notify from './routes/notify';

const router = Router();

router.post('/_matrix/push/v1/notify', async (request: Request, env: Env) => {
	var result = await notify.notify(request, env);
	if (result == null) {
		result = {}
	}

	return new Response(JSON.stringify(result), {
		status: 200, headers: {
			"content-type": "application/json"
		}
	})

});

router.get('/health', async (request: Request, env: Env) => {
	return new Response("", { status: 200 })
});

router.all('*', () => new Response("Not found", { status: 404 }));

export default {
	fetch: router.handle,
};
