//const config = require('./config.json')
const TelegramBot = require('node-telegram-bot-api');
const Agenda = require('agenda');

const mongoConnectionString = process.env.MONGODB_URL;
const agenda = new Agenda({db: {address: mongoConnectionString}});

const bot = new TelegramBot(process.env.token, {polling: true});
bot.on("polling_error", (err) => console.log(err));

agenda.define('send-message', {priority: 'high'}, async job => {
    // console.log("Send Message running");
    const {chatId, replyMessage, replyId} = job.attrs.data;
    await bot.sendMessage(chatId, replyMessage.reminderMessage, {"reply_to_message_id": replyId});
})

agenda.define('clean-database', async job => {    
    const numRemoved = await agenda.cancel({name: 'send-message', nextRunAt: {$ne: null}});
    // console.log(numRemoved + " have been removed");
});

// agenda.schedule('in 10 seconds', 'task', {"id": 123});
(async function() { // IIFE to give access to async/await
    await agenda.start();
    await agenda.every('1 minute', 'clean-database');
})();

async function setReminder(msg, replyMessage, incomingMessage, replyId) {
    let chatId = msg.chat.id;
    const result = /.+ ([0-9]+) ((m|mins|min|minutes|minute)|(h|hour|hours)|(d|days|day))$/.exec(incomingMessage);

    if(result !== null) {
        if(result[3] !== undefined) {
            bot.sendMessage(chatId, replyMessage.confirmation);
            console.log("Scheduling message in " + result[1]);
            await agenda.schedule('in ' + result[1] + 'seconds', 'send-message', {"chatId": chatId, "replyMessage": replyMessage, "replyId": replyId});
        } else if (result[4] !== undefined) {
            bot.sendMessage(chatId, replyMessage.confirmation);
            await agenda.schedule('in ' + result[1] + 'hours', 'send-message', {"chatId": chatId, "replyMessage": replyMessage, "replyId": replyId});
        } else if (result[5] !== undefined) {
            bot.sendMessage(chatId, replyMessage.confirmation);
            await agenda.schedule('in ' + result[1] + 'days', 'send-message', {"chatId": chatId, "replyMessage": replyMessage, "replyId": replyId});
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