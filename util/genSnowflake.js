let zeroFill = (s, w) => new Array(w - s.length).fill('0').join('') + s;
const genSnowflake = (increment, processID, workerID) => {
    let timestamp = zeroFill((new Date().getTime() - 1591092539000).toString(2), 42);
    increment = zeroFill(process.reqCount.toString(2), 12);
    processID = zeroFill(processID, 5);
    workerID = zeroFill(workerID, 5);
    return parseInt(timestamp + processID + workerID + increment, 2).toString();
};
module.exports = genSnowflake;
