const config = require('./config.json')
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(config.token, {polling: true});
bot.on("polling_error", (err) => console.log(err));

bot.onText(/\/conf (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];

    const result = /.+([0-9]+) ((m|mins|min|minutes|minute)|(h|hour|hours)|(d|days|day))$/.exec(resp);

    const reminderMessage = "Aaka, samay hogya hai";
    const confirmation = "Ji! Mere aaka";
    const errorMessage = '❓';

    if(result !== null) {
        if(result[3] !== undefined) {
            bot.sendMessage(chatId, confirmation);
            setTimeout(() => bot.sendMessage(chatId, reminderMessage, {"reply_to_message_id": msg.message_id}), result[1]*60000);
        } else if (result[4] !== undefined) {
            bot.sendMessage(chatId, confirmation);
            setTimeout(() => bot.sendMessage(chatId, reminderMessage, {"reply_to_message_id": msg.message_id}), result[1]*3600000);
        } else if (result[5] !== undefined) {
            bot.sendMessage(chatId, confirmation);
            setTimeout(() => bot.sendMessage(chatId, reminderMessage, {"reply_to_message_id": msg.message_id}), result[1]*86400000);
        } else {
            bot.sendMessage(chatId, errorMessage);
        }
    } else {
        bot.sendMessage(chatId, errorMessage);
    }
})