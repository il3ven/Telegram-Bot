const agenda = require('./lib/agenda.js')
const bot = require('./lib/bot.js')
const syncMessageStats = require('./lib/mongodb.js')

const data = require('./data.js')

async function setReminder(msg, replyMessage, incomingMessage, replyId) {
    let chatId = msg.chat.id;
    const result = /.+ ([0-9]+) ((m|mins|min|minutes|minute)|(h|hour|hours)|(d|days|day))$/.exec(incomingMessage);

    if(result !== null) {
        if(result[3] !== undefined) {
            bot.sendMessage(chatId, replyMessage.confirmation);
            console.log("Scheduling message in " + result[1]);
            await agenda.schedule('in ' + result[1] + 'minutes', 'send-message', {"chatId": chatId, "replyMessage": replyMessage, "replyId": replyId});
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

(async function() {
    await syncMessageStats(); // Add event emitters after memory is synced with DB

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
    
    bot.onText(/.+/, (msg, match) => {
        let dataFound = false;

        console.log("Data in memory", data.getArray());
    
        data.getArray().forEach(elm => {
            if(elm._id == msg.chat.id) {
                elm.totalMessages++;
                dataFound = true;
                console.log("Stats updated for " + elm._id);
            }
        });
    
        if(!dataFound) {
            // Add data
            data.push({
                "_id": msg.chat.id,
                "totalMessages": 1
            })
            console.log("Stats inserted for " + msg.chat.id);
        }
    })
})();