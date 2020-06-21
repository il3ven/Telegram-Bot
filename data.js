/**
 * The data received from Database is stored here.
 * data[] acts as RAM
 * 
 * Format :
 * data[0] = {
 *      _id: user id from telegram,
 *      totalMessages: number of total messages
 * }
 */

let data = [];

module.exports.push = function (json) {
    data.push(json);
}

module.exports.setArray = function (newArray) {
    data = newArray;
}

module.exports.getArray = function () {
   return data;
}