# Agent Prompts

**A tested system prompt for AI agents that talk to customers, on web chat, voice, WhatsApp and phone.**

This is the platform prompt that runs every agent on [Duvi](https://www.duvi.ai). We rewrote it after measuring, over hundreds of real-model conversations, what makes customer-facing agents sound like a script. It is open so you can use it, take it apart and tell us where it is wrong.

| What we measured | Before | After |
| --- | --- | --- |
| Replies ending in "Would you like..." or "Let me know if..." | 74% | 30% |
| Stock sign-offs | 63% | 15% |
| Average reply length | 29 words | 22 words |
| Blind judge thought a human wrote it | 0 of 9 | 3 of 9 |
| Pass rate across 10 models on the core scenarios, all 5 channels | 25% | 62% |

How these were measured, what did not work, and what a prompt cannot fix: [FINDINGS.md](FINDINGS.md).

## What is in it

- **[prompts/platform.md](prompts/platform.md)**: the house rules. Understand before answering, no scripted empathy, where facts may come from, copying numbers exactly, holding a fact when challenged, and how to end a message. Plus worked examples that use placeholders, so the model copies the shape and never the content.
- **[prompts/registers/](prompts/registers/)**: how to sound on each channel. [Chat](prompts/registers/chat.md), [voice](prompts/registers/voice.md) (only full stops and commas, numbers spelled out, two sentences at most) and [WhatsApp](prompts/registers/whatsapp.md).
- **[prompts/business.md](prompts/business.md)**: how to write the part each business adds on top, and what it must leave out.
- **[src/](src/)**: a small, dependency-free composer that assembles the right prompt and tool rules for each channel.

## How it fits together

```text
system prompt (identical on every turn, so the provider caches it)
├── business prompt     who is speaking, the job, boundaries, tone
├── platform rules      prompts/platform.md
├── tool rules          only for the tools available on this channel
└── register            chat, voice or WhatsApp

each turn, sent with the person's message and not kept in history
├── <now>               the time in their time zone
├── <contact>           what you already know about them
├── <page>              the page they are on, with its links (web only)
├── <retrieved-context> the passages your search found
└── <turn-register>     typed or spoken, on a web widget that does both
```

Anything that changes per turn goes in the turn notes, never in the system prompt, so the cache stays warm.

| Channel | Register | Tools |
| --- | --- | --- |
| `web-chat` | chat, plus voice for switching | search_knowledge, open_page, save_contact, hand_to_team |
| `web-voice` | chat plus voice, turn marked as spoken | same as web-chat |
| `whatsapp` | WhatsApp | search_knowledge, save_contact, hand_to_team |
| `whatsapp-call` | voice, as a call | same as whatsapp |
| `phone` | voice, as a call | same as whatsapp |

## Use it

### Copy the prompt

Not on JavaScript? Copy [prompts/platform.md](prompts/platform.md) and fill its four slots: `{{business}}`, `{{caller}}` (a verified phone line, or nothing), `{{tools}}` and `{{registers}}`. The tool rules are in [src/tools.js](src/tools.js). Rename the tools in the text if yours are called something else.

### Or use the composer

```bash
npm install github:duvi-ai/agent-prompts
```

```js
import { buildSystemPrompt, turnNotes, toolsFor, asFunctionTools } from 'agent-prompts';

const channel = 'whatsapp';

const system = buildSystemPrompt({
  business: 'You are the assistant for Northwind, a project management app. Help visitors pick a plan.',
  channel,
});

const notes = turnNotes({
  channel,
  timeZone: 'Europe/London',
  retrieved: [{ url: 'https://northwind.example/pricing', text: 'Basic: $12 a month. Pro: $29 a month.' }],
});

const response = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: `${notes}\n\n${userText}` },
  ],
  tools: asFunctionTools(toolsFor(channel)),
});
```

Store `userText` in your history, not the notes. Fresh notes are built every turn.

The composer works with any provider that takes a system prompt and function tools: OpenAI, Anthropic, Gemini, or anything OpenAI-compatible. Requires Node 20 or later.

## What a prompt will not fix

From [FINDINGS.md](FINDINGS.md), in short:

- **Small models on voice.** A 14B model ignored the voice register no matter how it was written. Route calls to a model that can hold it.
- **Bad retrieval.** Cleaning crawled pages and adding a page header to every chunk took link search from 1 in 12 to 9 in 12. No prompt change came close.
- **Tools that overpromise.** If a tool result lets the agent sound like it did more than it did, fix the tool.
- **Rare empty replies after a tool call.** Retry in code.

## Further reading

The sources behind the rules, all worth reading in full:

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), Anthropic
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), Anthropic
- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) and [Prompting Realtime models](https://developers.openai.com/api/docs/guides/voice-prompting), OpenAI
- [Prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies), Google
- [Prompting guide](https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide), ElevenLabs
- [Control Illusion: The Failure of Instruction Hierarchies in LLMs](https://arxiv.org/abs/2502.15851)

The full list is at the end of [FINDINGS.md](FINDINGS.md).

## Contributing

Found a case where the prompt does the wrong thing? [Open an issue](https://github.com/duvi-ai/agent-prompts/issues) with the conversation, the model and the channel. A transcript that breaks it is more useful to us than a suggested rewrite.

## License

[MIT](LICENSE). Made by [Duvi](https://www.duvi.ai), where you can [build an agent](https://studio.duvi.ai) that runs on this prompt.
