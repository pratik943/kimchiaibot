const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const KIMCHI_API_KEY = process.env.KIMCHI_API_KEY;

module.exports = async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || !message.text) {
      return res.status(200).send("ok");
    }

    const chatId = message.chat.id;
    const userText = message.text;

    const aiResponse = await axios.post(
      "https://api.kimchi.dev/v1/chat/completions",
      {
        model: "kimi-k2.5",
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

    const reply =
      aiResponse.data.choices?.[0]?.message?.content ||
      "No response.";

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: reply
      }
    );

    res.status(200).send("ok");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(200).send("error");
  }
};
