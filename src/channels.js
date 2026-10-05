const CALL = Object.freeze({
  setting: 'on a live call',
  screen: null,
  turnLine: 'this turn is spoken aloud on a live call',
  speaker: 'Caller',
});

const WIDGET = Object.freeze({
  setting: 'in a live voice conversation on the website',
  screen:
    'The website is still on their screen while you talk, so you can still read and act on the page and take them to other pages. Do it, then say in a few spoken words what you did.',
  turnLine: 'this turn is spoken aloud in a live voice conversation on the website, not a phone call',
  speaker: 'User',
});

export const CHANNELS = Object.freeze({
  'web-chat': {
    id: 'web-chat',
    surface: 'web',
    registers: ['chat', 'voice'],
    turn: 'chat',
    voice: WIDGET,
    page: true,
  },
  'web-voice': {
    id: 'web-voice',
    surface: 'web',
    registers: ['chat', 'voice'],
    turn: 'voice',
    voice: WIDGET,
    page: true,
  },
  whatsapp: {
    id: 'whatsapp',
    surface: 'whatsapp',
    registers: ['whatsapp'],
    turn: null,
    voice: null,
    page: false,
  },
  'whatsapp-call': {
    id: 'whatsapp-call',
    surface: 'whatsapp',
    registers: ['voice'],
    turn: null,
    voice: CALL,
    page: false,
  },
  phone: { id: 'phone', surface: 'phone', registers: ['voice'], turn: null, voice: CALL, page: false },
});

export const channelOf = (channel) => {
  const resolved = typeof channel === 'string' ? CHANNELS[channel] : channel;
  if (!resolved) throw new Error(`Unknown channel "${channel}". Use one of: ${Object.keys(CHANNELS).join(', ')}`);
  return resolved;
};
