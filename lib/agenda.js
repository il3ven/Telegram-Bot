const Agenda = require('agenda');
const bot = require('./bot.js');
const MongoClient = require('mongodb').MongoClient;
const data = require('../data.js');
const syncMessageStats = require('./mongodb.js')
const getAPost = require('./reddit')

const mongoConnectionString = process.env.MONGODB_URL;
const agenda = new Agenda({db: {address: mongoConnectionString}});

agenda.define('send-message', {priority: 'high'}, async job => {
    console.log("Send Message running");
    const {chatId, replyMessage, replyId} = job.attrs.data;
    await bot.sendMessage(chatId, replyMessage.reminderMessage, {"reply_to_message_id": replyId});
})

agenda.define('clean-database', async job => {    
    const numRemoved = await agenda.cancel({name: 'send-message', nextRunAt: null});
    console.log(numRemoved + " have been removed");
});

agenda.define('backup-data', async job => {
    console.log("Starting backup of data");

    if(data.getArray().length != 0) {
        const client = new MongoClient(mongoConnectionString);

        try {
            await client.connect();
            const db = client.db('test');
            const col = db.collection('messageStats');
    
            let toDoOperations = [];
    
            data.getArray().forEach(elm => {
                toDoOperations.push({
                    updateOne: { filter: {_id: elm._id}, update: {$set: {totalMessages: elm.totalMessages}}, upsert:true }
                })
            })
    
            await col.bulkWrite(toDoOperations);
            console.log("Data backed up");
           
            client.close();
        } catch (err) {
            console.log("Error in backing up data");
            console.log(err.stack);
        }
    
        client.close();
    } else {
        console.log("Nothing to backup");
    }
});

agenda.define('regular-stats', async job => {
    console.log("Starting regular sending of stats");

    await syncMessageStats();

    if(data.getArray().length != 0) {
        try {
            const sksUserData = data.getArray().find(userData => {
                return userData._id === parseInt(process.env.sksGroupId)
            })

            const [title, url] = await getAPost()
            if(title && url) {
                const message = 
                `Scoreboard : ${sksUserData.totalMessages} \n${title} \n${url}`
                console.log("Sending", message)

                bot.sendMessage(sksUserData._id, message);
            } else {
                throw new Error('Failed to get a post from Reddit')
            }

        } catch(err) {
            console.error("Cannot send scoreboard", err);
        }

        const client = new MongoClient(mongoConnectionString);

        try {
            await client.connect();
            const db = client.db('test');
            const col = db.collection('messageStats');
    
            let toDoOperations = [];
    
            data.getArray().forEach(elm => {
                toDoOperations.push({
                    updateOne: { filter: {_id: elm._id}, update: {$set: {totalMessages: 0}}, upsert:true }
                })
            })
    
            await col.bulkWrite(toDoOperations);
            console.log("Data reset done");

            await syncMessageStats();
           
            client.close();
        } catch (err) {
            console.log("Error in resetting up data");
            console.log(err.stack);
        }
    
        client.close();
    }
});

(async function() {
    try {
        await agenda.start();
        await agenda.every('30 minute', 'clean-database');
        await agenda.every('5 minute', 'backup-data');
        await agenda.every('1 day', 'regular-stats'); // regular-stats should be sufficienlty larger than backup-data
    } catch(err) {
        console.error(err)
    }
})();

module.exports = agenda;