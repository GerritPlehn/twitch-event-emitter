# Twitch Event Emitter
```js
const TEE = require('./twitch-event-emitter');
const config = {
    channels: [{
        name: 'someChannelName',
        user: 'someUserName',
        commands: [{
                heist: [{
                        state: 'started',
                        regex: /Heist started with (?<someNumber>[0-9]+ participants)/
                    },
                    {
                        state: 'finished',
                        regex: /The heist is finished/
                    }
                ]
            }
        ]
    }]
}
let events = new TEE(config);
events.someChannelName.heist.on('started', {someNumber} => {
    console.log(`a heist with ${someNumber} people was started`);
});
```