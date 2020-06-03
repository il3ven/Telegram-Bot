// const {mongoDbUrl, dbName} = require('../config.json');
const MongoClient = require('mongodb').MongoClient;
const data = require('../data.js');

const mongoConnectionString = process.env.MONGODB_URL || mongoDbUrl;

var syncMessageStats = async function() {
  const client = new MongoClient(mongoConnectionString);

  try {
      await client.connect();
      const db = client.db('test');
      const col = db.collection('messageStats');

      const docs = await col.find().toArray();

      data.setArray(docs);

      console.log("New data in memory after syncing", data.getArray());
  } catch (err) {
    console.log(err.stack);
  }

  // Close connection
  client.close();
}

module.exports = syncMessageStats;