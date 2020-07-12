Math.getRandomNum = function (min, max) {
    return Math.random() * (max - min) + min;
};
Math.getRandomInt = function (min, max) {
    return Math.round(Math.random() * (max - min)) + min;
};
Math.getFRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};
Math.conRad = function (angle) {
    return (Math.PI / 180) * angle;
};
Math.roundToDeci = (num, n) => {
    return Math.round(num * n) / n;
};

Math.roundToDeca = (num, n) => {
    return Math.round(num / n) * n;
};
Math.test = () => {
    console.log('Random number between 0 and 10', Math.getRandomNum(0, 10));
    console.log('Random integer between 0 and 10', Math.getRandomInt(0, 10));
    console.log('45 degrees converted to radians', Math.conRad(45));
    console.log('0.004005 rounded to the nearest tenth', Math.roundToDeci(0.004005, 100));
    console.log('123456789 rounded to the nearest thousand', Math.roundToDeca(123456789, 1000));
};
Math.test();
//Math.test()
module.exports = Math;
