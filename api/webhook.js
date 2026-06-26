const axios = require("axios");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const BAI_API_KEY = process.env.BAI_API_KEY;

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(200).send("Bot is running");
  }

  try {

    console.log("STEP 0 - Webhook hit");

    const update = req.body;

    if (!update || !update.message) {
      return res.status(200).send("No message");
    }

    const chatId = update.message.chat.id;
    const userText = update.message.text;

    console.log("STEP 1 - Message received:", userText);
    console.log("API KEY EXISTS:", !!BAI_API_KEY);

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`,
      {
        chat_id: chatId,
        action: "typing"
      }
    );

    console.log("STEP 2 - Sending request to BAI");

    const aiResponse = await axios.post(
      "https://api.b.ai/v1/chat/completions",
      {
        model: "glm-5.2",
        messages: [
          {
            role: "user",
            content: userText
          }
        ]
      },
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${BAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("STEP 3 - BAI responded");
    console.log(JSON.stringify(aiResponse.data, null, 2));

    let reply =
      aiResponse?.data?.choices?.[0]?.message?.content ||
      "No response received.";

    reply = reply
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .trim();

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: reply
      }
    );

    return res.status(200).send("OK");

  } catch (error) {

    console.error("ERROR:");

    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }

    return res.status(200).send("ERROR");
  }
};
