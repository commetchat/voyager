<p align="center" style="padding-top:20px">
<h1 align="center">Voyager</h1>
<p align="center">Serverless push gateway for Matrix</p>

<p align="center">
    <a href="https://matrix.to/#/#commet:matrix.org">
        <img alt="Matrix" src="https://img.shields.io/matrix/commet%3Amatrix.org?logo=matrix">
    </a>
    <a href="https://fosstodon.org/@commetchat">
        <img alt="Mastodon" src="https://img.shields.io/mastodon/follow/109894490854601533?domain=https%3A%2F%2Ffosstodon.org">
    </a>
    <a href="https://twitter.com/intent/follow?screen_name=commetchat">
        <img alt="Twitter" src="https://img.shields.io/twitter/follow/commetchat?logo=twitter&style=social">
    </a>
</p>


# Development
This service is built as a Cloudflare Worker. Check out [this guide](https://developers.cloudflare.com/workers/get-started/guide/) if you are unfamiliar.

# API
Voyager is compatable with both, Unified Push and Firebase Cloud Messaging. To maintain compatability with other Unified Push <-> Matrix gateways, it is assumed that by default a request uses Unified Push, unles Firebase is specified.

### Request to homeserver to register using FCM
Note the addition of `"type": "fcm"` to specify that this uses Firebase
```json
{
    "app_id": "chat.commet.commetapp.android",
    "pushkey": "FCM_CLIENT_PUSH_KEY_HERE",
    "app_display_name": "Commet for Android",
    "data": {
        "type": "fcm",
        "format": "event_id_only",
        "url": "http://push.commet.chat/_matrix/push/v1/notify"
    },
    "device_display_name": "Android Phone",
    "kind": "http",
    "lang": "en",
    "profile_tag": ""
}
```

### Example request from homeserver for FCM notification
```json
{
    "notification": {
        "devices": [
            {
                "app_id": "chat.commet.commetapp.android",
                "data": {
                    "type": "fcm"
                },
                "pushkey": "FCM_CLIENT_PUSH_KEY_HERE"
            }
        ],
        "event_id": "$cmfAyePJH4n7AnzWDGlJyS6g3RRkNDOGBTtbnTrWgzs",
        "prio": "high",
        "room_id": "!OGEhHVWSdvArJzumhm:matrix.org"
    }
}
```
