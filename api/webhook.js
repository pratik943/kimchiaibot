const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const KIMCHI_API_KEY = process.env.KIMCHI_API_KEY;

module.exports = async (req, res) => {
  // Browser visit test
  if (req.method !== "POST") {
    return res.status(200).send("Bot is running");
  }

  try {
    const update = req.body;

    if (!update || !update.message) {
      return res.status(200).send("No message");
    }

    const chatId = update.message.chat.id;
    const userText = update.message.text;

    // Send typing indicator
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`,
      {
        chat_id: chatId,
        action: "typing"
      }
    );

    // Ask Kimchi
    const aiResponse = await axios.post(
      "https://llm.kimchi.dev/openai/v1/chat/completions",
      {
        model: "minimax-m2.7",
        messages: [
          {
            role: "user",
            content: userText
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${KIMCHI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply =
  aiResponse?.data?.choices?.[0]?.message?.content ||
  "Sorry, no response received.";

reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // Reply to Telegram
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: reply
      }
    );

    return res.status(200).send("OK");

  } catch (error) {
    console.error(
      error?.response?.data || error?.message || error
    );

    return res.status(200).send("ERROR");
  }
};
