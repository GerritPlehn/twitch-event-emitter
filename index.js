const tmi = require('tmi.js');
const EventEmitter = require('events');
class TwitchEventEmitter {

  constructor(twitchEventConfig) {
    this.config = twitchEventConfig;
    this.channels = [];
    for (const channel of this.config.channels) {
      this.createEvents(channel);
      this.channels.push(channel.name);
    }
  }

  createEvents = (channel) => {
    this[`${channel.name}`] = {
      channelName: channel.name,
      userName: channel.user
    };
    this[`${channel.name}`].commands = [];
    for (const command in channel.commands) {
      this[`${channel.name}`][command] = new class T extends EventEmitter {
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
      }(channel.commands[command]);
      this[`${channel.name}`].commands.push(this[`${channel.name}`][command]);
    }
  }

  init = async () => {
    try {
      await this.connectToServer();
    } catch (e) {
      console.error(e)
    }
    this.channelConnections();
    this.listen();
  }

  connectToServer = async () => {
    this.tmiConfig = {
      connection: {
        secure: true,
        reconnect: true
      }
    };
    this.tmiClient = new tmi.Client(this.tmiConfig);
    try {
      await this.tmiClient.connect();
    } catch (e) {
      console.error(e);
    }
  }

  channelConnections = () => {
    //part from unneeded channels
    let currentChannels = this.tmiClient.getChannels();
    for (channel in currentChannels) {
      if (this.channels.indexOf(channel) === -1) {
        this.tmiClient.part(channel);
      }
    }
    //join channels
    for (let channel of this.channels) {
      if (currentChannels.indexOf(channel) === -1) {
        this.tmiClient.join(channel)
      }
    }
  }

  listen = () => {
    this.tmiClient.on('message', (channel, userstate, message, self) => {
      channel = channel.replace('#', '');
      const channelObject = this[`${channel}`];
      if (channelObject.userName === userstate.username) {
        channelObject.commands.forEach((emitter) => emitter.checkmessage(message));
      }
    })
  }
}
module.exports = TwitchEventEmitter;