const Agenda = require('agenda');
// const {mongoDbUrl, dbName} = require('../config.json');
const bot = require('./bot.js');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const data = require('../data.js');
const syncMessageStats = require('./mongodb.js')

const mongoConnectionString = process.env.MONGODB_URL || mongoDbUrl;
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
        data.getArray().forEach(userData => {
            console.log("Sending regular stats to ", userData._id);
            const message = `Scoreboard!!\n\n${userData.totalMessages} have been exchanged till now`;
            bot.sendMessage(userData._id, message);
        })
    }
});

(async function() { // IIFE to give access to async/await
    await agenda.start();
    await agenda.every('1 minute', 'clean-database');
    await agenda.every('50 seconds', 'backup-data');
    await agenda.every('2 minute', 'regular-stats');
})();

module.exports = agenda;