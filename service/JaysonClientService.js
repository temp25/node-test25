const jayson = require('jayson');
const Log = require('./LogService');
const env = require('../util/env');
const rpcClientURI = env.RPC_CLIENT_URI;

let jaysonClient = jayson.client.http(rpcClientURI);
let aria2cRPCSupportedMethods = [];
let gids = [];

let makeRPCRequest = function (aria2cRPCMethod, aria2cRPCParams, httpResponse = null, socketIO) {
    jaysonClient.request(aria2cRPCMethod, aria2cRPCParams, function (err, response) {
        let rpcStatusCode, rpcOutput={};
        if(err) {
            rpcStatusCode = err.code;
            Log.e(err);
        } else {
            rpcStatusCode = 200;
            rpcOutput = response.result;
        }

        if(aria2cRPCMethod == 'system.listMethods') {
            Log.i(`Loaded ${response.result.length} RPC methods for Aria2c`);
            aria2cRPCSupportedMethods = response.result;
        } else if(aria2cRPCMethod == 'system.multicall') {
            if(response.result !== undefined) {
                let isAddURIResult = true;
                response.result.forEach(result => {
                    if(typeof result[0] === 'string') {
                        // add gid to GID list
                        gids.push(result[0]);
                    } else {
                        isAddURIResult = false;
                    }
                });
                if(!isAddURIResult) {
                    sendToClient(socketIO, aria2cRPCMethod, rpcOutput, rpcStatusCode, err);
                }
            }
        } else {
            if(httpResponse !== null) {
                sendToClient(socketIO, aria2cRPCMethod, rpcOutput, rpcStatusCode, err, httpResponse);
            } else {
                sendToClient(socketIO, aria2cRPCMethod, rpcOutput, rpcStatusCode, err);
            }
        }

    });
};

function sendToClient(socketIO, aria2cRPCMethod, rpcOutput, rpcStatusCode, err, httpResponse = null) {
    let output = {
        aria2cRPCMethod: aria2cRPCMethod,
        result: rpcOutput,
        statusCode: rpcStatusCode,
        error: err
    };

    if (httpResponse !== null) {
        httpResponse.status(rpcStatusCode).json(output);
    } else {
        socketIO.emit('rpc-message', JSON.stringify(output));
    }
}

function getSupportedMethods() {
    return aria2cRPCSupportedMethods;
}

function sendTellActiveData(io) {
    let tellActiveParamArray = [];
    let tellActiveSubParamArray = [];

    if(gids.length !== 0) {
        gids.forEach(gid => {
            tellActiveSubParamArray.push({
                'methodName': 'aria2.tellStatus',
                'params': [ gid ]
            });
        });
        tellActiveParamArray.push(tellActiveSubParamArray);
        makeRPCRequest('system.multicall', tellActiveParamArray, null, io);
    } else {
        Log.i('No GIDs available to poll download status');
    }
}

if(jaysonClient === undefined) {
    throw Error(`Jayson client couldn't connect to RPC client, ${rpcClientURI}`);
} else {
    Log.i(`RPC client initialized for URI, ${rpcClientURI}`);
    makeRPCRequest('system.listMethods', []);
}

module.exports = {
    supportedMethods: getSupportedMethods,
    rpcRequest: makeRPCRequest,
    sendTellActiveData: sendTellActiveData,
};
