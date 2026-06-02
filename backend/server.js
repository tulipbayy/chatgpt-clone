import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const localDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
const netlifyOrigin = /^https:\/\/[a-z0-9-]+\.netlify\.app$/;
const allowedOrigins = new Set(
  (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        localDevOrigin.test(origin) ||
        netlifyOrigin.test(origin) ||
        allowedOrigins.has(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(bodyParser.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

async function handleChat(req, res) {
  const { messages } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages must be an array" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful, clear, and friendly assistant in a student-built ChatGPT clone.",
        },
        ...messages.map(({ role, content }) => ({ role, content })),
      ],
    });

    const reply = completion.choices[0]?.message;

    if (!reply?.content) {
      return res.status(502).json({ error: "OpenAI returned an empty response" });
    }

    res.json({ message: reply });
  } catch (error) {
    console.error("OpenAI request failed:", error);
    res.status(500).json({ error: "Failed to get a chatbot response" });
  }
}

app.post("/chat", handleChat);
app.post("/api/chat", handleChat);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
