const commonUtils = require('../util/common');
const path = require('path');

module.exports = function (jaysonClient, io) {
    let module = {};

    module.getHealth = function (req, res) {
        res.status(200).json({
            status: 'UP',
            timestamp: commonUtils.timestamp()
        });
    };

    module.getRPCMethods = function (req, res) {
        res.status(200).json({
            methods: jaysonClient.supportedMethods(),
            timestamp: commonUtils.timestamp()
        });
    };

    module.rpcRequest = function (req, res) {
        let statusCode = 200;
        let message;

        let showOutput = req.query.showOutput || false;
        let aria2cRPCMethod = req.body.method;
        let aria2cRPCParams = req.body.params;

        if (jaysonClient.supportedMethods().includes(aria2cRPCMethod)) {
            message = 'method accepted';
            statusCode = 200;
            jaysonClient.rpcRequest(aria2cRPCMethod, aria2cRPCParams, (showOutput ? res : null), io);
        } else {
            statusCode = 500;
            message = 'method not accepted. See /supportedRPCMethods for further info';
        }

        if(!showOutput) {
            res.status(statusCode).json({
                message: message,
                timestamp: commonUtils.timestamp()
            });
        }
    };

    module.respondWith404 = function(req, res) {
        res.status(404);
    
        if(req.accepts(['html', 'json']) === 'json') {
            res.send({
                error: `The requested resource, ${req.originalUrl} is not available on the server`,
                timestamp: commonUtils.timestamp()
            });
            return;
        }
    
        //res.sendFile('views/404.html', { root: __dirname });
        res.sendFile(path.join(__dirname, "../views/", '404.html'));
    }
    
    return module;
};