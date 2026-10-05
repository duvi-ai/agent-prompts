# Findings

What we learned writing and testing this prompt in September 2026. Two studies, both on Duvi's production agent pipeline, with real models and real tool calls.

- **Study 1.** A knowledge base for a fictional car dealership, so any fact the model stated that was not in it was provably invented. Two models (gemini-3.1-flash-lite and a self-hosted qwen3-14b), web chat and voice, a blind judge, and a human-written control. About 180 conversations over three repeat runs.
- **Study 2.** The real duvi.ai website as the knowledge base. 22 scenarios across web chat, web voice, WhatsApp chat, WhatsApp calls and phone calls. Ten models from Google, OpenAI and a self-hosted one. Deterministic checks plus a judge model.

Each finding says how strong the evidence is. Single runs are noisy: two runs of identical code disagreed on 10 of 27 conversations, so differences under about 5 to 10 points mean nothing.

## 1. The giveaway is the ending

A blind judge, shown transcripts without tool calls and told that length is not quality, had to guess whether each agent was a human or an AI.

| Prompt | Model | Sounds human (1 to 5) | Restraint (1 to 5) | Judged human |
| --- | --- | --- | --- | --- |
| Before | qwen3-14b | 1.67 | 3.44 | 0/9 |
| Before | gemini-3.1-flash-lite | 2.11 | 3.67 | 0/9 |
| After | qwen3-14b | 2.44 | 3.89 | 1/9 |
| After | gemini-3.1-flash-lite | 3.11 | 4.67 | 3/9 |
| Human control | | 5.00 | 5.00 | 5/5 |

The control matters: the judge was not stamping "AI" on everything. It picked out human writing 5 times out of 5.

The tell it named most often, in 34 of 40 verdicts, was **the closing call to action**. 92 to 96% of replies ended in "Would you like to..." or "Let me know if...". The cause was in our own prompt: every example reply in the chat register ended in a question. Examples outweigh rules, so the model learned the reflex from them.

After the rewrite, across three independent runs on gemini, replies ending on a question or offer went from 69% (±4.5) to 36% (±7.1), and the average reply went from 29 to 21 words. What shipped:

| Channel and model | Ends on a question or offer | Stock sign-off | Words |
| --- | --- | --- | --- |
| Web, gemini | 74% → 30% | 63% → 15% | 29.1 → 21.6 |
| Web, qwen | 70% → 52% | 52% → 33% | 28.9 → 21.0 |
| Voice, gemini | 74% → 30% | 56% → 11% | 30.6 → 22.6 |
| Voice, qwen | 74% → 63% | 56% → 48% | 30.6 → 24.1 |

What did it: an explicit ENDINGS section, and example replies that mostly just stop.

## 2. Under pressure, the old prompt kept selling

```text
Person: how much for the ranger
Agent:  The on-road price for the Ranger in Pune is 14.2 lakh rupees.
        Would you like to know more about its specs or maybe book a test drive?
Person: you already said that
Agent:  You're right, I apologize. Since you already have the price, would you
        like to hear about the 402 km range or maybe how to book a test drive?
Person: just give me a number
Agent:  The Ranger has a 402 km range on a full charge.
        Would you like to schedule a test drive to try it out?
```

Asked for a number it had already given, it gave a different number and pitched again. The fix is the "get shorter, and repeat the thing they actually asked about" example and the rule "match their length and pace, but not their heat".

Our first fix broke something else. Leaning on "admit gaps plainly" made gemini deny a price it had stated one message earlier, as soon as the person pushed back. That is why WHEN YOU ARE CHALLENGED exists: hold a grounded fact, offer the reconciliation, and correct only real mistakes.

## 3. Models copy examples word for word

The first examples used believable fake details. Gemini reused the lines nearly verbatim, and those lines were the ones the judge rated most human, which meant the gain would not carry to another business. Worse, a smaller model copied the fake facts into real answers and copied example replies like "Done, I've booked that" when it had booked nothing.

Every example now uses placeholders such as `<price>` and shows no actions. This was neutral or better on every model we tried.

## 4. Numbers need their own rule

With the right figures sitting in its context, qwen3-14b said 350 km instead of 402, 150 km instead of 245, and invented a whole product line ("EV-1, EV-2 and EV-3") without calling a tool. A short NUMBERS AND NAMES section took ungrounded numbers to zero on both models.

## 5. Restructuring alone does nothing

In study 2 we tried a pure restructure first: same rules, cleaner sections. The pass rate stayed at 36%. The rewrite that moved it to 55%, with no change to the knowledge base, changed specific things:

- tool rules written as steps and "act in this turn" instead of about 30 "never" lines
- one definition of what counts as a verified source
- telling the web voice agent that the page is still on the person's screen
- placeholder examples

The gains came from removing specific causes of failure, not from a prettier prompt.

## 6. Later rules silently win

The web voice agent kept saying "I can't do that, I'm on a call" when asked to open a page. The voice rules came after the chat rules in the prompt, and nothing told it the website was still on screen. Models do not flag conflicting instructions. They pick one, usually the later or louder one. That is why each channel gets its own register, and why the business prompt must not restate them (see [prompts/business.md](prompts/business.md)).

## 7. The business prompt barely matters once the platform is right

Business prompts rewritten to our guide scored the same as the originals: 70% against 70%. The guide's value is that it stops business prompts from fighting the platform, not that it raises scores.

## 8. Results across models

Pass rates on the 10 core scenarios of study 2, before and after the prompt and knowledge-base changes. One run per cell.

| Model | Before | After |
| --- | --- | --- |
| gemini-3.5-flash-lite | 20% | 70% |
| gemini-3.1-flash-lite | 30% | 70% |
| gemini-3.5-flash | 20% | 70% |
| gemini-3.6, 3.7 and 3.8-flash | 40 to 50% | 70 to 90% |
| gpt-5.4 | 40% | 70% |
| gpt-5-mini | 10% | 40% |
| gpt-5-nano | 0% | 40% |
| qwen3-14b | 0% | 20% |
| All models | 25% | 62% |

On the 27 natural conversations we re-ran after shipping, the Duvi agent went from 64% to 83%.

## 9. What a prompt cannot fix

- **Small models on voice.** qwen3-14b read colons and spec lists aloud, contradicted itself about a handover it had just made, and opened a PDF as a web page. The same prompt on gemini did none of that. Route voice to a model that can hold the register.
- **Empty replies after a tool call.** Gemini occasionally returned nothing right after a tool result, about 1 in 290 turns. Handle it in code with a retry.
- **Bad retrieval.** Stripping repeated navigation and footer text from crawled pages and putting a `Page: host/path` header on every chunk took link search from 1 in 12 to 9 in 12. No prompt change came close.
- **Tools that overpromise.** Telling the model in the save-contact result that nobody has been notified helped only a little. If a tool can make the agent sound like it has done more than it has, fix the tool.

## 10. Test the rig, not just the prompt

Our first report flagged a "bug": the model was writing `<turn-register>` tags into replies. It turned out the test harness never sent the per-turn note the prompt said would arrive, so the model wrote the missing tag itself. With the note sent the way production sends it, there were zero leaks in 26 turns. Describe a mechanism to the model and it will try to perform it, so make sure your test setup matches production before you trust a finding.

## Sources

The rules in the prompt draw on these, plus our own measurements above.

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), Anthropic: the "right altitude" for instructions, and examples over lists of edge cases
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), Anthropic: give rules a reason, and examples are followed closely
- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering), OpenAI: Identity, Instructions, Examples, Context, with content reused on every request placed first so caching pays off
- [Using GPT-6](https://developers.openai.com/api/docs/guides/latest-model), OpenAI: prompting best practices for the current models
- [Prompting Realtime models](https://developers.openai.com/api/docs/guides/voice-prompting), OpenAI: labelled sections for voice, sample phrases as anchors that must be varied, and overlapping always, never and must rules hurting performance
- [Prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies), Google
- [Prompting guide](https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide), ElevenLabs: sectioned voice agent prompts
- [Front desk agent example](https://github.com/livekit/agents/blob/main/examples/frontdesk/agent.py), LiveKit
- [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval), Anthropic: chunk context headers
- [Control Illusion: The Failure of Instruction Hierarchies in Large Language Models](https://arxiv.org/abs/2502.15851)
- [A Closer Look at System Prompt Robustness](https://arxiv.org/abs/2502.12197)
- [MultiChallenge: A Realistic Multi-Turn Conversation Evaluation Benchmark](https://arxiv.org/abs/2501.17399): instruction retention across turns
- [The Pink Elephant Problem](https://eval.16x.engineer/blog/the-pink-elephant-negative-instructions-llms-effectiveness-analysis), 16x Eval: why stacks of "don't" rules degrade output
