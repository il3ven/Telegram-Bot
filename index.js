const agenda = require('./lib/agenda.js')
const bot = require('./lib/bot.js')
const syncMessageStats = require('./lib/mongodb.js')

const data = require('./data.js')

async function setReminder(msg, replyMessage, incomingMessage, replyId) {
    try {
        const job = await agenda.schedule(incomingMessage, 'send-message', {"chatId": msg.chat.id, "replyMessage": replyMessage, "replyId": replyId});
        const date = new Date(job.attrs.nextRunAt);

        bot.sendMessage(msg.chat.id, `Mai aapko ${date.toLocaleString("en-GB", {timezone: "Asia/Kolkata"})} par yaad dila dunga`)
    } catch (error) {
        console.error("Could not create reminder");
        bot.sendMessage(msg.chat.id, replyMessage.errorMessage);
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
            "reminderMessage" : "Aaka, bhule toh nahi ?",
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