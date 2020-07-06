// require('dotenv').config()
const agenda = require('./lib/agenda.js')
const bot = require('./lib/bot.js')
const syncMessageStats = require('./lib/mongodb.js')

const data = require('./data.js')

// This array should be in lower case
const validTags = ['#important', '#imp', '#serious', '#announcement', '#pinthis', 'pinthismessage', '#all'];

// Util function
function formatDate(nextRunAt, timeNow) {
    let output = '';

    if(nextRunAt.getTime() - timeNow >= 60000) {
        // Time difference is greater than 1 minute
        if(nextRunAt.getTime() - timeNow >= 86400000) {
            // Time difference is greater than 1 day
            const options = {weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true};
            output = nextRunAt.toLocaleString('en-GB', options);
        } else {
            output = nextRunAt.toLocaleString('en-US', {timeStyle: 'short'})
        }
    } else {
        output = nextRunAt.toLocaleString('en-US', {timeStyle: 'medium'}); // en-US for 12 hour time
    }

    return output;
}

async function setReminder(msg, replyMessage, incomingMessage, replyId) {
    try {
        const timeNow = Date.now(); // In milliseconds
        const job = await agenda.schedule(incomingMessage, 'send-message', {"chatId": msg.chat.id, "replyMessage": replyMessage, "replyId": replyId});
        const date = new Date(job.attrs.nextRunAt);

        bot.sendMessage(msg.chat.id, `Jo hukum. (${formatDate(date, timeNow)})`)
    } catch (error) {
        console.error("Could not create reminder");
        bot.sendMessage(msg.chat.id, replyMessage.errorMessage);
    }
}

function updateMessageStats(msg) {
    let userFound = false; // Is the user id in database ?

    console.log("Data in memory", data.getArray());

    data.getArray().forEach(elm => {
        if(elm._id == msg.chat.id) {
            elm.totalMessages++;
            userFound = true;
            console.log("Stats updated for " + elm._id);
        }
    });

    if(!userFound) {
        // Add data
        data.push({
            "_id": msg.chat.id,
            "totalMessages": 1
        })
        console.log("Stats inserted for " + msg.chat.id);
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
        updateMessageStats(msg);

        // Only broadcast those messages which are from the sks group
        if(msg.chat.id == process.env.sksGroupId) {
            if(msg.entities) {
                // Some mention, hashtag present
                let isValidTagPresent = false;

                msg.entities.forEach((entity) => {
                    if(entity.type === 'hashtag') {
                        let receivedTag = msg.text.slice(entity.offset, entity.offset + entity.length).toLowerCase();
                        if(validTags.includes(receivedTag))
                        isValidTagPresent = true;
                    }
                })

                if(isValidTagPresent) {
                    bot.forwardMessage(process.env.sksChannelId, msg.chat.id, msg.message_id, {'disable_notification': true});
                }
            }
        }
    })
})();