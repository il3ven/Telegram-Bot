const MongoClient = require('mongodb').MongoClient;
// const {mongoDbUrl, dbName} = require('../config.json');
const data = require('../data.js');

const mongoConnectionString = process.env.MONGODB_URL || mongoDbUrl;

var syncMessageStats = async function() {
  const client = new MongoClient(mongoConnectionString);

  try {
      await client.connect();
      console.log("Connected correctly to server");

      const db = client.db('test');

      const col = db.collection('messageStats');

      // Get first two documents that match the query
      const docs = await col.find().toArray();

      data.setArray(docs);

      console.log("Data in memory ", data.getArray());
  } catch (err) {
    console.log(err.stack);
  }

  // Close connection
  client.close();
}

module.exports = syncMessageStats;