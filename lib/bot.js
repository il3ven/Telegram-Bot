const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.token, {polling: true});
bot.on("polling_error", (err) => console.log(err));

module.exports = bot;