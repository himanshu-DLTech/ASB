/* 
 * js.js - Runs native JS code
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const fs = require("fs");

exports.start = (routeName, js, messageContainer, message) => {
    LOG.info(`[ROUTE_JSONMODIFIER] Processing message with timestamp: ${message.timestamp}`);

    try {
        const json = message.content.data?.text ||  message.content.text || message.content.data?.textArray || message.content.textArray ;
        
        fs.rmSync(message.env.filepath);
        let outputFilePath = message.env.filepath.split("/");
        const filename = outputFilePath.pop(); outputFilePath.pop();
        outputFilePath.push("done", filename);
        outputFilePath = outputFilePath.join("/");
        fs.writeFileSync(outputFilePath, JSON.stringify(json));
    
        message.content = {};
        message.addRouteDone(routeName);
    } catch (e) {
        LOG.error(`[ROUTE_JSONMODIFIER] Error in computing: ${e}, dropping this message`);
        LOG.error(`[ROUTE_JSONMODIFIER] Dropping: ${JSON.stringify(message)}`);
        message.addRouteError(routeName);
    }
}