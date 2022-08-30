
/**
 * Prints to stdout the info message 
 * 
 * @param {*} message 
 */
function info(message) {
    console.info(`${getTimestamp()}  INFO : ${message}`);
}

/**
 * Prints to stderr the error message 
 * 
 * @param {*} message 
 */
function error(message) {
    console.error(`${getTimestamp()}  ERROR : ${message}`);
}

/**
 * Prints to stdout the debug message 
 * 
 * @param {*} message 
 */
function debug(message) {
    console.debug(`${getTimestamp()}  DEBUG : ${message}`);
}

/**
 * Prints to stderr the warning message 
 * 
 * @param {*} message 
 */
function warn(message) {
    console.warn(`${getTimestamp()}  WARN : ${message}`);
}

/**
 * Prints to stdout the info
 * 
 * @param {*} message 
 */
function print(message) {
    console.log(message);
}

function getTimestamp() {
    let timeStamp = new Date().toISOString().split(/[T|Z]+/);
    return `${timeStamp[0]} ${timeStamp[1]}`;
}

module.exports = {
    i: info,
    e: error,
    d: debug,
    w: warn,
    p: print
}
