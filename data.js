
let data = [];

module.exports.push = function (json) {
    data.push(json);
}

module.exports.getArray = function () {
   return data;
}