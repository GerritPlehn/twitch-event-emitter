const tmi = require('tmi.js');
const EventEmitter = require('events');
class TwitchEventEmitter {
    constructor(twitchEventConfig) {
        this.tmiConfig = {
            connection: {
                secure: true,
                reconnect: true
            },
            channels: []
        };
        for (const channel of twitchEventConfig.channels) {
            this.tmiConfig.channels.push(channel.name);
            TwitchEventEmitter.prototype[channel.name] = {
                channelName: channel.name,
                userName: channel.user
            };
            TwitchEventEmitter.prototype[channel.name].commands = [];
            for (const command of channel.commands) {
                TwitchEventEmitter.prototype[channel.name][Object.keys(command)[0]] = new class T extends EventEmitter {
                    constructor(states) {
                        super();
                        this.states = states;
                    };
                    checkmessage = (message) => {
                        this.states.forEach((state, matches) => {
                            if ((matches = message.match(state.regex)) !== null) {
                                this.emit(state.state, matches.groups ? matches.groups : undefined);
                            }
                        });
                    }
                }(command[Object.keys(command)[0]]);
                TwitchEventEmitter.prototype[channel.name].commands.push(TwitchEventEmitter.prototype[channel.name][Object.keys(command)[0]]);
            }
        }
        this.tmiClient = new tmi.Client(this.tmiConfig);
        this.tmiClient.connect();
        this.tmiClient.on('message', (channel, userstate, message, self) => {
            channel = channel.replace('#', '');
            const channelObject = TwitchEventEmitter.prototype[channel];
            if (channelObject.userName === userstate.username) {
                channelObject.commands.forEach((emitter) => emitter.checkmessage(message));
            }
        })
    }
}
module.exports = TwitchEventEmitter;