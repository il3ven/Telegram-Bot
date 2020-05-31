const config = require('./config.json')
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.token || config.token, {polling: true});
bot.on("polling_error", (err) => console.log(err));

function setReminder(msg, replyMessage, incomingMessage, replyId) {
    let chatId = msg.chat.id;
    const result = /.+ ([0-9]+) ((m|mins|min|minutes|minute)|(h|hour|hours)|(d|days|day))$/.exec(incomingMessage);

    if(result !== null) {
        if(result[3] !== undefined) {
            bot.sendMessage(chatId, replyMessage.confirmation);
            setTimeout(() => bot.sendMessage(chatId, replyMessage.reminderMessage, {"reply_to_message_id": replyId}), result[1]*60000);
        } else if (result[4] !== undefined) {
            bot.sendMessage(chatId, replyMessage.confirmation);
            setTimeout(() => bot.sendMessage(chatId, replyMessage.reminderMessage, {"reply_to_message_id": replyId}), result[1]*3600000);
        } else if (result[5] !== undefined) {
            bot.sendMessage(chatId, replyMessage.confirmation);
            setTimeout(() => bot.sendMessage(chatId, replyMessage.reminderMessage, {"reply_to_message_id": replyId}), result[1]*86400000);
        } else {
            bot.sendMessage(chatId, replyMessage.errorMessage);
        }
    } else {
        bot.sendMessage(chatId, replyMessage.errorMessage);
    }
}

bot.onText(/\/conf (.+)/, (msg, match) => {
    const reply = {
        "reminderMessage" : "Aaka, samay hogya hai",
        "confirmation" : "Ji! Mere aaka",
        "errorMessage" : '❓'
    };

    setReminder(msg, reply, match[1], msg.message_id);
})

bot.onText(/\/remind (.+)/, (msg, match) => {
    const reply = {
        "reminderMessage" : "Reminder up",
        "confirmation" : "Hanji!",
        "errorMessage" : '❓'
    };

    if(msg.reply_to_message !== undefined) {
        setReminder(msg, reply, match[1], msg.reply_to_message.message_id);
    } else {
        setReminder(msg, reply, match[1], msg.message_id);
    }
})