# Writing the business prompt

The platform prompt in this folder is one half of what the model reads. The other half is the business prompt: the part each business writes for its own agent. It goes in the `{{business}}` slot at the very top.

In our tests, most of the problems that looked like bad wording came from the two halves fighting. A business prompt that restates channel or formatting rules competes with the platform prompt, and the model settles the conflict silently and unpredictably. So the split below is strict.

## Who owns what

| The business prompt owns | The platform prompt owns |
| --- | --- |
| Who is speaking | How long a reply is |
| Where they are and who they talk to | Markdown, tables and lists |
| What the conversation is for | How voice replies are spoken |
| The few facts that never change | Where facts may come from |
| What it must never do for this business | Tool mechanics and honesty about actions |
| Tone, in a sentence or two | Endings, empathy and handling pushback |

If a sentence in a business prompt is about format, channel, speech or tools in general, delete it. The platform already says it, and saying it twice is how conflicts start.

## Facts belong in knowledge

Ask whether a colleague would have to change the sentence when the business changes. If yes, it is a fact and belongs in the knowledge base, where retrieval can find it with a source attached. If it would still be true after a rebrand, a price rise and a new product line, it is behaviour and belongs in the prompt.

A price written into the prompt and a different price in knowledge is the most common way an agent quotes the wrong number.

## The six blocks

Write it as six short labelled sections, in this order. Identity and situation are stable, so they sit first. Job and boundaries change as you learn what customers ask, so they sit lower.

| Block | Answers | Example line |
| --- | --- | --- |
| Identity | Who is speaking | You are the assistant on the Northwind website. |
| Situation | Where, and to whom | Most visitors arrive from the pricing page and have not signed up yet. |
| Job | What it is for, in order | Work out what they want to automate, then point them at the right plan. |
| Boundaries | What it must never do here | You cannot see or change customer accounts. |
| Tone | How it sounds | Plain and direct, like a founder answering their own inbox. |
| Key pages | Where to send people | Sign up at studio.example.com. Contact sales at example.com/contact. |

Give every rule a reason. "You cannot see customer accounts" is followed narrowly. "You cannot see customer accounts, because you run on the public website without a login" generalises to cases you never wrote down.

## Template

```text
IDENTITY
You are <name>, the assistant for <business> on <where>.

SITUATION
<Who is talking to you and what they usually already know.>

JOB
<What a good conversation ends in, in one or two sentences.>

BOUNDARIES
<What you cannot do here, each with its reason.>

TONE
<One or two sentences.>

KEY PAGES
<Two to five URLs people ask for most.>
```

## What we measured

Once the platform prompt was in place, business prompts written to this guide scored the same as the old ones (70% against 70%). The guide does not make agents better on its own. It stops business prompts from undoing the platform prompt, which is where the real failures were. See [FINDINGS.md](../FINDINGS.md).

## Further reading

- [System prompt guide](https://www.duvi.ai/docs/system-prompt), Duvi docs
- [Prompting guide](https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide), ElevenLabs
- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering), OpenAI
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), Anthropic
- [Prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies), Google
