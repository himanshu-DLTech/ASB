exports.start = async (routeName, header, messageContainer, message) => {
    const headers = ["Content-Type: application/json",
        `Authorization: ${message.content.token}`]
    header.flow.route1.headers = headers;
    message.env.to = message.content.id;
    const missingFields = [];
    Object.keys(message.content).forEach(key => {
        if(key !=="report_to" && !message.content[key] )
            missingFields.push(key);

    });
    message.env.datatowrite = message.content;
    message.env.missingFields = missingFields;
    message.content = {};
    message.addRouteDone(routeName);
    message.setGCEligible(true);
}