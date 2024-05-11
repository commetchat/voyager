import { Env } from "..";
import { Buffer } from "buffer";
// @ts-ignore
import { getTokenFromGCPServiceAccount } from "@sagi.io/workers-jwt";

interface PushGatewayResponse {
	rejected: string[]
};

export default {
	async notify(request: Request, env: Env): Promise<any> {
		var content: any = await request.json()
		var notification = content['notification']

		var eventId = notification['event_id']
		var roomId = notification['room_id']
		var devices = notification['devices']

		var response: PushGatewayResponse = {
			rejected: []
		}

		for (var index in devices) {
			let device = devices[index]

			var type = "unified_push";
			if ("data" in device) {
				if ("type" in device["data"]) {
					type = device["data"]["type"]
				}
			}

			let key = device['pushkey']
			var result: PushGatewayResponse

			switch (type) {
				case "fcm":
					result = await this.notifyFcm(eventId, roomId, key, env)
					break;
				case "unified_push":
					result = await this.notifyUnifiedPush(eventId, roomId, key)
					break;
				default:
					result = {
						rejected: []
					}
			}

			result.rejected.forEach(element => {
				response.rejected.push(element);
			});
		}

		return response
	},

	async notifyUnifiedPush(eventId: string, roomId: string, pushKey: string): Promise<PushGatewayResponse> {

		var returnValue: PushGatewayResponse = {
			rejected: []
		}

		var url: URL;
		try {
			url = new URL(pushKey);
		} catch {
			console.log("Invalid url for unified push")
			returnValue.rejected.push(pushKey)
			return returnValue;
		}

		if (url.protocol != "https:") {
			console.log("Unified push key protocol was not https")
			returnValue.rejected.push(pushKey)
			return returnValue
		}

		var content = {
			"notification": {
				"event_id": eventId,
				"room_id": roomId,
			}
		}

		let result = await fetch(pushKey, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(content)
		})

		if (result.status != 200) {
			returnValue.rejected.push(pushKey)
		}

		return returnValue
	},

	async notifyFcm(eventId: string, roomId: string, userKey: string, env: Env): Promise<PushGatewayResponse> {
		const decode = (str: string): string => Buffer.from(str, 'base64').toString('binary')
		var keyData = JSON.parse(decode(env.FIREBASE_KEY_B64));

		const jwtToken = await getTokenFromGCPServiceAccount({
			serviceAccountJSON: keyData,
			aud: "https://oauth2.googleapis.com/token",
			payloadAdditions: {
				scope: [
					"https://www.googleapis.com/auth/firebase.messaging",
				].join(" "),
			},
		});

		var response: any = await (
			await fetch("https://oauth2.googleapis.com/token", {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
					assertion: jwtToken,
				}),
			})
		).json()

		let token = response['access_token']

		response = await (
			await fetch(`https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`, {
				method: 'POST',
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: JSON.stringify({
					"message": {
						"data": {
							"event_id": eventId,
							"prio": "high",
							"room_id": roomId
						},
						"token": userKey
					}
				})
			})).json()

		var result: PushGatewayResponse = {
			rejected: []
		}

		if ('error' in response) {
			result.rejected.push(userKey)
		}

		return result;
	}
};
