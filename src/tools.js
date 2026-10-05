import { channelOf } from './channels.js';

export const TOOL_RULES = [
  '- When they ask for something one of your tools can do, call the tool in this turn and say briefly what you did only after it succeeds. They already asked, so do not ask permission or explain how they could do it themselves, unless the instructions at the top ask you to confirm or show a draft first for that kind of change.',
  '- When one tool result lets you take the next step toward what they asked, take it in the same turn. Stop to ask only for something only they can tell you.',
  '- When a choice is yours to make, such as wording or a sensible default, and nothing they said decides it, make it and show what you chose rather than asking them to choose. Where the instructions at the top ask for a draft to be approved before saving, show it and save once they agree.',
  '- Never say you have done something unless a tool call returned success for it. If you have no tool for what they want, say plainly that you cannot do it.',
];

export const TOOLS = [
  {
    name: 'search_knowledge',
    description:
      'Search the business knowledge base. Returns matching passages, each with the URL of the page it came from, or NO_MATCHING_CONTEXT_FOUND.',
    parameters: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 3,
          description: 'Two or three phrasings of what to look for.',
        },
      },
      required: ['queries'],
    },
    guidance: [
      '- Use search_knowledge when <retrieved-context> does not answer the question, and when they ask for a page or link. Pass two or three phrasings.',
    ],
    surfaces: ['web', 'whatsapp', 'phone'],
  },
  {
    name: 'open_page',
    description: 'Take the website visitor to one verified page in their current tab.',
    parameters: {
      type: 'object',
      properties: { url: { type: 'string', description: 'The exact verified URL.' } },
      required: ['url'],
    },
    guidance: [
      '- Use open_page only when they explicitly ask to open, go to, or visit one clear page.',
      '- The URL must come from the <page> block, <retrieved-context>, search_knowledge, or the person, because a made-up address breaks or points somewhere wrong.',
    ],
    surfaces: ['web'],
  },
  {
    name: 'save_contact',
    description:
      "Save the person's own name, email, phone and location the moment they share them. Call it once with every field you just learned.",
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        location: { type: 'string' },
      },
    },
    guidance: [
      "- Use save_contact for the person's own name, email, phone and location.",
      '- Never ask for contact details the <contact> block already shows.',
    ],
    surfaces: ['web', 'whatsapp', 'phone'],
  },
  {
    name: 'hand_to_team',
    description:
      'Flag this conversation for the human team, with a one line summary of what the person needs. Returns what happens next.',
    parameters: {
      type: 'object',
      properties: { summary: { type: 'string' } },
      required: ['summary'],
    },
    guidance: [
      '- Use hand_to_team when they ask for a person, or when they need something only the team can do. Tell them what happens next using only what the tool returned.',
    ],
    surfaces: ['web', 'whatsapp', 'phone'],
  },
];

export const toolsFor = (channel) => {
  const { surface } = channelOf(channel);
  return TOOLS.filter((tool) => tool.surfaces.includes(surface));
};

export const toolGuidance = (tools) => {
  const names = tools.map((tool) => tool.name);
  return [
    `- Available tools this turn: ${names.length ? names.join(', ') : 'none'}. Call only these.`,
    ...TOOL_RULES,
    ...tools.flatMap((tool) => tool.guidance || []),
  ].join('\n');
};

export const asFunctionTools = (tools) =>
  tools.map(({ name, description, parameters }) => ({ type: 'function', function: { name, description, parameters } }));
