const Log = require('./LogService');
const minimist = require('minimist');
const basicAuth = require('basic-auth');

const path = require('path');
const APP_VERSION = 'v1.0';

let authUser, authPassword;
const argv = minimist(process.argv.slice(2), { alias: {H: 'h', h: 'help', V: 'v', v: 'version'} });

const nodeExecName = path.basename(process.argv[0]);
const programName = path.basename(process.argv[1]);

const expressAuth = (req, res, next) => {
    let user = basicAuth(req);
    if( user === undefined || user["name"] !== authUser || user["pass"] !== authPassword ) {
      res.statusCode = 401;
      res.setHeader("WWW-Authenticate", 'Basic realm="Aria2cWebUI authentication"');
      res.sendFile(path.join(__dirname, "../views/", '401.html'));
    } else {
      next();
    }
};

function showUsage() {
    Log.p(``);
    Log.p(`Usage:\t${nodeExecName} ${programName} [OPTIONS]`);
    Log.p(``);
    Log.p(`OPTIONS:`);
    Log.p(``);
    Log.p(`--http-user            Username for basic authentication. (optional)`);
    Log.p(`--http-password        Password for basic authentication. (optional)`);
    Log.p(`-v / -V / --v / --V    Prints the version of the application and exits`);
    Log.p(`-h / -H / --h / -H     Prints this help and exits`);
    Log.p(``);
    process.exit(0);
}

function showVersion() {
    Log.p(`Aria2c back-end for Web UI ${APP_VERSION}`);
    process.exit(0);
}

function parseArguments(app) {

    if(argv.h || argv.help) {
        // Display help
        showUsage();
    } else if(argv.v || argv.version) {
        // Display version
        showVersion();
    }
    
    authUser = argv['http-user'];
    authPassword = argv['http-password'];
    
    if(authUser!==undefined && authPassword===undefined) {
        throw new Error('Basic Auth: user provided but password is missing. Run with -h for usage');
    }
    
    if(authUser===undefined && authPassword!==undefined) {
        throw new Error('Basic Auth: password provided but user is missing. Run with -h for usage');
    }
    
    if(authUser && authPassword) {
        Log.p('Basic auth provided. Guarding endpoints with it.');
        app.use(expressAuth);
    } else {
        Log.w('No basic auth provided. Routes will be unsecured');
    }
}

module.exports = {
    parseArgs: parseArguments
}