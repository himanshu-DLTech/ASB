exports.start = async (routeName, auth, messageContainer, message) => {
    console.log(auth);
    if (message.env.missingFields.length) {
        message.env.result = false;
        message.env.status = `Missing Fields - ${message.env.missingFields}`;
    } else {
        // List of allowed timezones with abbreviations
        const allowedTimezones = [
            'EST', 'CST', 'MST', 'PST', 'AKST', 'HST', 'JST', 'SGT', 'IST'
        ];

        // Get the user's timezone
        const userTimezone = message.env.datatowrite.timezone;

        // Check if the timezone is valid
        if (!allowedTimezones.includes(userTimezone)) {
            message.env.result = false;
            message.env.status = "Input is invalid. Please select from these timezones: US (EST, CST, MST, PST, AKST, HST), Japan (JST), India (IST), Singapore (SGT)";
        } else if (!message.content.error && message.content.data && (message.content.data.email === message.env.datatowrite.email)) {
            message.env.datatowrite.id = message.content.data.id;
            message.env.result = true;
            message.env.status = "Registered successfully";
        }else if(!message.content.data){
            message.env.result = false;
            message.env.status = "Invalid Token";
        }else {
            message.env.result = false;
            message.env.status = "Wrong Email ID";
        }
    }
    message.addRouteDone(routeName);
    message.setGCEligible(true);
}