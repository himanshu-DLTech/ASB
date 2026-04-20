const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);
exports.start = async (routeName, update, messageContainer, message) => {
    console.log(update);
    if (message.env.result && message.env.missingFields.length == 0 )
        message.content[message.env.datatowrite.email] = {
            "id":message.env.datatowrite.id,
            "name": message.env.datatowrite.name,
            "token": crypt.encrypt(message.env.datatowrite.token),
            "role":message.env.datatowrite.role,
            "timezone":message.env.datatowrite.timezone,
            "report_to":message.env.datatowrite.report_to,
        };
    message.addRouteDone(routeName);
    message.setGCEligible(true);
}