exports.start = async (routeName, result, messageContainer, message) => {
    console.log(result);
    message.content = {}
    message.content.result = message.env.result;
    message.content.status = message.env.status;
    message.addRouteDone(routeName);
    message.setGCEligible(true);
}