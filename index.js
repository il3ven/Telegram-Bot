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

    if(nextRunAt.getDay() != timeNow.getDay()) {
        // Show long version
        const options = {weekday: 'short', month: 'short', day: 'numeric'};
        output = nextRunAt.toLocaleString('en-GB', options) + ', ';
    }

    if(nextRunAt.getSeconds() != timeNow.getSeconds()) {
        output += nextRunAt.toLocaleString('en-US', {timeStyle: 'medium'}); // en-US for 12 hour time
    } else {
        // No difference between seconds thus omit it
        output += nextRunAt.toLocaleString('en-US', {timeStyle: 'short'})
    }

    return output;
}

async function setReminder(msg, replyMessage, incomingMessage, replyId) {
    try {
        const timeNow = new Date();
        const job = await agenda.schedule(incomingMessage, 'send-message', {"chatId": msg.chat.id, "replyMessage": replyMessage, "replyId": replyId});
        const date = new Date(job.attrs.nextRunAt);

        await bot.sendMessage(msg.chat.id, `Jo hukum. (${formatDate(date, timeNow)})`)
    } catch (error) {
        console.error("Could not create reminder");
        await bot.sendMessage(msg.chat.id, replyMessage.errorMessage);
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

    bot.onText(/\/help/, async (msg, match) => {
        await Promise.all([
            bot.sendPhoto(msg.chat.id, 'assets/example.jpg'),
            bot.sendMessage(msg.chat.id, 
`Use me to remind yourself.

*How to use?*

Quote a message and ask me to remind me you.

*Examples*
\`\`\`
/remind me after 1 week and 3 hours
/remind me after 1 hour and 20 mins
/remind me after 1 sec

/remind me at 10:10am on 3rd March
/remind me tomorrow
/remind me next monday at 22:00
\`\`\`
`, {parse_mode: 'Markdown'})
            ])
    })

    bot.onText(/\/conf (.+)/, async (msg, match) => {
        const reply = {
            "reminderMessage" : "Aaka, samay hogya hai",
            "confirmation" : "Ji! Mere aaka",
            "errorMessage" : '❓'
        };
    
        await setReminder(msg, reply, match[1], msg.message_id);
    })
    
    bot.onText(/\/remind (.+)/, async (msg, match) => {
        const reply = {
            "reminderMessage" : "Aaka, bhule toh nahi ?",
            "confirmation" : "Hanji!",
            "errorMessage" : '❓'
        };
    
        if(msg.reply_to_message !== undefined) {
            await setReminder(msg, reply, match[1], msg.reply_to_message.message_id);
        } else {
            await setReminder(msg, reply, match[1], msg.message_id);
        }
    })
    
    bot.onText(/.+/, async (msg, match) => {
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
                    await bot.forwardMessage(process.env.sksChannelId, msg.chat.id, msg.message_id, {'disable_notification': true});
                }
            }
        }
    })
})();