import { readFileSync } from 'node:fs';
import { channelOf } from './channels.js';
import { toolsFor, toolGuidance } from './tools.js';

const read = (name) => readFileSync(new URL(`../prompts/${name}`, import.meta.url), 'utf8').trim();

const PLATFORM = read('platform.md');
const REGISTERS = {
  chat: read('registers/chat.md'),
  voice: read('registers/voice.md'),
  whatsapp: read('registers/whatsapp.md'),
};

const WEB_REGISTER_NOTE =
  'This session can switch between typed chat and spoken voice mid-conversation. Each turn includes a <turn-register> note naming the active register. Follow only that register for the current turn.';

const DEFAULT_BUSINESS = 'You are the customer assistant for this business.';

const fill = (template, values) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing prompt value: ${key}`);
    return values[key];
  });

const voiceRegister = (framing) =>
  fill(REGISTERS.voice, {
    setting: framing.setting.toUpperCase(),
    screen: framing.screen ? `\n- ${framing.screen}` : '',
    speaker: framing.speaker,
  });

const registerText = (channel) => {
  const blocks = channel.registers.map((name) => (name === 'voice' ? voiceRegister(channel.voice) : REGISTERS[name]));
  const note = blocks.length > 1 ? `${WEB_REGISTER_NOTE}\n\n` : '';
  return `${note}${blocks.join('\n\n')}`;
};

const callerLine = (caller) =>
  caller?.phone
    ? `\nThe caller is verified by the telephony provider as ${caller.phone}. Trust it, use it naturally when relevant, and never ask them to confirm it.`
    : '';

export const buildSystemPrompt = ({ business, channel, tools, caller } = {}) => {
  const resolved = channelOf(channel || 'web-chat');
  return fill(PLATFORM, {
    business: (business || DEFAULT_BUSINESS).trim(),
    caller: callerLine(caller),
    tools: toolGuidance(tools || toolsFor(resolved)),
    registers: registerText(resolved),
  });
};

const NOW_FORMAT = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

const nowNote = (now, timeZone) => {
  const formatted = new Intl.DateTimeFormat('en-GB', { ...NOW_FORMAT, timeZone: timeZone || 'UTC' }).format(now);
  return timeZone ? `<now>${formatted} (${timeZone}, the person's local time)</now>` : `<now>${formatted} (UTC)</now>`;
};

const pageNote = (page) =>
  `<page>\nurl: ${page.url}\ntitle: ${page.title}\nlinks:\n${page.links.map((link) => `${link.label} -> ${link.url}`).join('\n')}\n</page>`;

const retrievedNote = (passages) =>
  `<retrieved-context>\n${passages.map((p) => `${p.url}: ${p.text}`).join('\n\n')}\n</retrieved-context>`;

const turnRegisterNote = (channel) =>
  channel.turn === 'voice'
    ? `<turn-register>voice: ${channel.voice.turnLine}. Follow the voice register.</turn-register>`
    : '<turn-register>chat: this turn is typed in the chat window. Follow the web chat register.</turn-register>';

export const turnNotes = ({ channel, now = new Date(), timeZone, contact, page, retrieved } = {}) => {
  const resolved = channelOf(channel || 'web-chat');
  return [
    nowNote(now, timeZone),
    contact && Object.keys(contact).length ? `<contact>${JSON.stringify(contact)}</contact>` : null,
    resolved.page && page ? pageNote(page) : null,
    retrieved?.length ? retrievedNote(retrieved) : null,
    resolved.turn ? turnRegisterNote(resolved) : null,
  ]
    .filter(Boolean)
    .join('\n');
};
