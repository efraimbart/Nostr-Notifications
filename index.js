import 'websocket-polyfill'
import pkg from 'nostr-tools';
const { relayInit } = pkg;

import PushBullet from 'pushbullet';
import { bech32 } from 'bech32';
  
const pusher = new PushBullet(process.env['PUSHBULLET_ACCESS_TOKEN']);

const relay = relayInit('wss://relay.damus.io');

const users = ['8a40148d8ac4cea732771d473b0e6110d15800c32c0e3e2e0236c36f5c1c7c04'];
users.forEach(user => {
  const channelName = `${user} Nostr Notifications`
  const channelTag = `${user}-nostr-notifications`;
  const channelDescription = `Nostr norifications for pubkey: ${user}`;
  pusher.channelInfo(channelTag)
    .then(channel => { 
      console.log(channel)
      //TODO: Not working yet
      if (channel.status != 200) {
        pusher.createChannel({ tag: channelTag, name: channelName, description: channelDescription})
          .then(channel => console.log(channel))
      } 
    });
  // console.log(channel);
  // 
});

relay.on('connect', () => {
  console.log(`connected to ${relay.url}`)
});

relay.on('error', () => {
  console.log(`failed to connect to ${relay.url}`)
});

await relay.connect();

const sub = relay.sub([
  {
    kinds: [1],
    '#p': users,
    limit: 1
  }
]);

sub.on('event', event => {
  console.log('we got the event we wanted:', event)
  let words = bech32.toWords(Buffer.from(event.id, 'hex'))
  let bechEvent = bech32.encode('note', words)
  console.log(bechEvent)
  pusher.link({channel_tag: '8a40148d8ac4cea732771d473b0e6110d15800c32c0e3e2e0236c36f5c1c7c04-nostr-notifications'}, 'New Mention', `nostr:${bechEvent}`, event.content)
    .then(push => console.log(push))
});

sub.on('eose', () => {
  sub.unsub()
});