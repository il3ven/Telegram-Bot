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