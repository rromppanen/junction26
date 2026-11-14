// Structured-output, bounded retry and validation pattern adapted from Gap Radar's analyst.ts.
export const defaultGeminiModel = "gemini-3.5-flash-lite";

export async function askGemini<T>(options: {
  system: string; input: unknown; schema: object; validate: (value: unknown) => T;
  signal?: AbortSignal; retries?: number;
}): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured.");
  const model = process.env.GEMINI_MODEL || defaultGeminiModel;
  if (!/^[a-zA-Z0-9.-]+$/.test(model)) throw new Error("Invalid Gemini model name.");
  let correction = "";
  for (let attempt = 0; attempt <= (options.retries ?? 1); attempt++) {
    options.signal?.throwIfAborted();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(options.input) + correction }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 5000, responseMimeType: "application/json", responseSchema: options.schema },
      }),
    });
    if (!response.ok) throw new Error("Gemini request failed.");
    const body = await response.json();
    const text = body.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("");
    try { return options.validate(JSON.parse(text ?? "")); }
    catch (error) {
      if (attempt === (options.retries ?? 1)) throw new Error("Gemini output did not pass validation.");
      // Only our bounded validator messages are sent, never a provider error or credential.
      correction = `\nThe previous answer failed validation. Fix this issue: ${error instanceof Error ? error.message.slice(0, 300) : "Invalid output"}`;
    }
  }
  throw new Error("Gemini output unavailable.");
}
