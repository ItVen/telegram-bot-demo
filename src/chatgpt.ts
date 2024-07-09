import "dotenv/config";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY || "";

if (!apiKey) {
  console.error(
    "apiKey token not provided. Please set the OPENAI_API_KEY environment variable."
  );
  process.exit(1);
}
const openAI = new OpenAI({
  apiKey: apiKey,
});

// 调用 OpenAI GPT-4 API 的函数
export const callGPT = async (prompt: string): Promise<string> => {
  try {
    const response = await openAI.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });
    console.log(response);
    return response.choices[0].message?.content?.trim() || "";
  } catch (error) {
    console.error("Error calling GPT-4 API:", error);
    throw error;
  }
};

const runExample = async () => {
  const prompt = "请简要介绍一下人工智能的发展历程。";

  console.log(prompt);
  const gptResponse = await callGPT(prompt);
  console.log("GPT-4 Response:", gptResponse);
};

// runExample();
