# DeepSeek Metadata Provider Implementation Record

## Scope

This slice adds the backend operation that requests a slug, free-form category, up to five tags, and a short feed summary from DeepSeek through the OpenAI Python SDK.

## Implementation plan and technical decisions

- The provider operation reads the API key, base URL, and model from cached backend settings. An absent or empty API key fails before any network request.
- It uses the OpenAI-compatible Chat Completions endpoint with `response_format={"type":"json_object"}`, an explicit JSON example in the system prompt, a 60-second timeout, and an 800-token response limit.
- The current configurable default remains `deepseek-flash`. DeepSeek's current update log identifies that name as its V4.1 Flash alias; JSON mode requires a JSON instruction and can still return empty content, so responses are checked and validated before return.
- The response is accepted only when a choice ends normally and its content parses as JSON conforming to the shared Pydantic metadata schema. Missing choices, empty or incomplete content, provider errors, malformed JSON, extra fields, and invalid values raise a stable `MetadataGenerationError` for the workflow layer to translate.
- There is no provider-specific logic in routes, no retry loop, and no multi-provider abstraction.

## Retrospective

- The shared schema's extra-field rejection was tightened for metadata values so the model cannot silently add fields that are outside the frozen contract.
- The provider configuration was verified without a live key; provider availability, live JSON quality, and latency were not exercised.

## Verification

- Python bytecode compilation completed for the backend package.
- A provider smoke check with an empty API key confirmed the expected stable configuration failure occurs before contacting DeepSeek.
- No automated tests were added or run.

## Remaining limits

- A real DeepSeek API key is required to exercise generation end to end.
- Metadata generation is synchronous; API latency is bounded by the 60-second request timeout, with no background queue or automatic retry.

## Provider references

- [DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode/) documents the JSON response format, explicit prompt instruction, token bound, and possibility of empty content.
- [DeepSeek API change log](https://api-docs.deepseek.com/updates/) identifies `deepseek-flash` as the V4.1 Flash model name in its September 10, 2026 update.
