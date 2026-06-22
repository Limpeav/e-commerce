import axios from "axios";

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_TRANSLATION_MODEL = "gemini-2.5-flash-lite";
const THAI_SCRIPT_PATTERN = /[\u0E00-\u0E7F]/;

export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

export const containsThaiScript = (text = "") => THAI_SCRIPT_PATTERN.test(String(text || ""));

export const translateTextWithGemini = async ({
  text,
  targetLanguageName,
  sourceInstruction = "Detect the source language automatically.",
  systemInstruction =
    "You are a precise ecommerce translation engine. Translate only the user-provided text. Preserve product names, prices, measurements, brand names, URLs, emojis, and formatting. Do not add explanations.",
}) => {
  const trimmedText = String(text || "").trim();

  if (!trimmedText) {
    return "";
  }

  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured");
  }

  const model = process.env.GEMINI_TRANSLATION_MODEL || DEFAULT_GEMINI_TRANSLATION_MODEL;
  const response = await axios.post(
    `${GEMINI_API_BASE_URL}/models/${model}:generateContent`,
    {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${sourceInstruction}\nTranslate to ${targetLanguageName}.\n\nText:\n${trimmedText}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    },
    {
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  return (
    response.data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim() || ""
  );
};
