import router from "./router";

export interface Env {
	FIREBASE_KEY_B64: string;
	FCM_PROJECT_ID: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return await router.fetch(request, env);
	},
};
