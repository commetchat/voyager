import { Env } from "..";
import { Buffer } from "buffer";
// @ts-ignore
import { getTokenFromGCPServiceAccount } from "@sagi.io/workers-jwt";


export default {
	async notify(request: Request, env: Env) {
		var content: any = await request.json()
		console.log(content)
		var notification = content['notification']

		var eventId = notification['event_id']
		var roomId = notification['room_id']
		var devices = notification['devices']

		for (var index in devices) {
			let device = devices[index]
			console.log(device)

			var type = "unified_push";
			if ("data" in device) {
				if ("type" in device["data"]) {
					type = device["data"]["type"]
				}
			}

			let key = device['pushkey']
			console.log(type);
			switch (type) {
				case "fcm":
					await this.notifyFcm(eventId, roomId, key, env)
					break;
				case "unified_push":
					await this.notifyUnifiedPush(eventId, roomId, key)
					break;
			}
		}
	},

	async notifyUnifiedPush(eventId: string, roomId: string, pushKey: string) {
		console.log("Notifying unified push");
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

		console.log(result)

		console.log({
			event: eventId,
			pushKey: pushKey,
			room: roomId,
		});
	},

	async notifyFcm(eventId: string, roomId: string, userKey: string, env: Env) {
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

		console.log(response)
	}
};
