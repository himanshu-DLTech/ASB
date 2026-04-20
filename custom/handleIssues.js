const fs = require('fs');
exports.start = async (routeName, _, messageContainer, message) => {
    const priorityOrder = {
        immediate: 1,
        urgent: 2,
        high: 3,
        normal: 4,
        low: 5
    };
    const statusCategories = [
        'assigned', 'acknowledged', 'feedback', 'confirmed', 'resolved', 'new'
    ];
    const colorCodes = {
        assigned: 'blue-color',
        acknowledged: 'brown-color',
        feedback: 'purple-color',
        confirmed: 'yellow-color',
        resolved: 'resolved-color',
        new: 'new-color'
    };

    const oldMantises = []; // To store mantises older than 7 days with specific statuses
    const veryOldMantises = []; // To store mantises older than 14 days with specific statuses

    const processIssues = (statusName) => {
        return message.content.data.issues
            .filter(issue => issue.status.name === statusName)
            .sort((a, b) => priorityOrder[a.priority.name] - priorityOrder[b.priority.name])
            .map(({ id, summary, priority, severity, project, handler, updated_at, notes }, index) => {
                // Check if the issue meets the criteria for being older than 7 days and having the specified status
                if (['assigned', 'acknowledged'].includes(statusName)) {
                    if (isOlderThanNDays(updated_at, 14, notes)) {
                        veryOldMantises.push({
                            index: Object.keys(veryOldMantises).length + 1,
                            id,
                            title: summary,
                            link: `https://tekmonks.mantishub.io/app/issues/${id}`,
                            channel: project.name,
                            priority: priority.name,
                            severity: severity.name,
                            class: Object.keys(veryOldMantises).length % 2 === 0 ? 'even-row' : 'odd-row',
                            handler: handler,
                            updated_at: updated_at,
                        });

                    } else if (isOlderThanNDays(updated_at, 7, notes)) {
                        oldMantises.push({
                            index: Object.keys(oldMantises).length + 1,
                            id,
                            title: summary,
                            link: `https://tekmonks.mantishub.io/app/issues/${id}`,
                            channel: project.name,
                            priority: priority.name,
                            severity: severity.name,
                            handler: handler,
                            class: Object.keys(oldMantises).length % 2 === 0 ? 'even-row' : 'odd-row',
                            updated_at: updated_at,
                        });
                    }
                }
                return {
                    index: index + 1,
                    id,
                    title: summary,
                    link: `https://tekmonks.mantishub.io/app/issues/${id}`,
                    channel: project.name,
                    priority: priority.name,
                    severity: severity.name,
                    handler: handler,
                    class: index % 2 === 0 ? 'even-row' : 'odd-row',
                    colorCode: colorCodes[statusName]
                };
            });
    };

    let processedIssues = {};
    let totalIssuesCount = 0;
    statusCategories.forEach(status => {
        const issues = processIssues(status);
        processedIssues[`${status}_mantis_issues`] = issues;
        totalIssuesCount += issues.length;
    });

    // Call the API if there are mantises older than 7 days with the specified statuses
    const today = new Date().getDay(); // 0 (Sunday) to 6 (Saturday)
    if (veryOldMantises.length > 0 && today === 1) {
        const managerEmail = getManagerEmail(message.content.data.issues[0].handler.email);
        const userAndManagerEmail = [message.content.data.issues[0].handler.email, ...managerEmail];
        const name = message.content.data.issues[0].handler.real_name;
        await callApiWithMantises(veryOldMantises, name, userAndManagerEmail, 'http://167.71.230.49:9000/overDueMantisToManager');
    }
    if (oldMantises.length > 0 && today === 5) {
        const email = message.content.data.issues[0].handler.email;
        const name = message.content.data.issues[0].handler.real_name;
        await callApiWithMantises(oldMantises, name, email, 'http://167.71.230.49:9000/overDueMantis');
    }

    let email = message.content.data.issues[0].handler.email;
    let extension = email.split('@').pop();
    if (extension == 'deeplogictech.com') {
        message.env.logoUrl = `https://media.licdn.com/dms/image/C510BAQFW2NK11feCHw/company-logo_200_200/0/1631415483428/deep_logictech_india_pvt_ltd_logo?e=2147483647&v=beta&t=a4GJXP7SpXKMjOr4vVN_A8-yF-4vDpVfcxRY5bnfKIw`
    }
    else {
        message.env.logoUrl = `https://media.licdn.com/dms/image/C4E0BAQGdltoPKDMEdw/company-logo_200_200/0/1672702350434/tekmonks_logo?e=2147483647&v=beta&t=Kqn94hRESztz1BZapVba-QaXIrT610xfHo7sVf2IrLw`
    }
    // read the activity of user from report file 
    let mantisId = message.content.data.issues[0].handler.id;
    message.env.name = message.content.data.issues[0].handler.real_name;
    message.content = {};
    let activity = mantisActivity(mantisId);
    message.content.mantisScore = activity.count;
    message.content.date = activity.date;

    statusCategories.forEach(status => {
        const issues = processedIssues[`${status}_mantis_issues`];
        message[`${status}_mantis_issues`] = issues;
        if (issues.length > 0) {
            message.content[`${status}Table`] = true;
            message.content[`${status}Issues`] = issues;
        }
    });

    message.content.logoUrl = message.env.logoUrl;
    message.content.count = totalIssuesCount;
    if (message.content.count == 0) {
        noMantisUsersData(message.env.name);
    }
    message.content.name = message.env.name;
    statusCategories.forEach(status => {
        delete message[`${status}_mantis_issues`];
    });
    message.addRouteDone(routeName);
    message.setGCEligible(true);
    if ((veryOldMantises.length > 0 && today === 1) || (oldMantises.length > 0 && today === 5)) messageContainer.add(message);
}


const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
};

const mantisActivity = (mantisId) => {
    try {
        const reportFile = `${CONSTANTS.ROOTDIR}/report.json`;
        const reportData = fs.readFileSync(reportFile);
        const jsonData = JSON.parse(reportData);

        const today = new Date()
        const date = new Date(today);
        date.setDate(today.getDate() - 1);
        const formattedDate = formatDate(date);
        let activity = {};
        if (jsonData.hasOwnProperty(formattedDate)) {
            if (jsonData[formattedDate][mantisId]) {
                activity.count = jsonData[formattedDate][mantisId];
                activity.date = newDateFormat(date);
            }
            else {
                activity.count = 0;
                activity.date = newDateFormat(date);;
            }

        }
        else {
            activity.count = 404;
            activity.date = newDateFormat(date);;
        }
        return activity;
    } catch (error) {
        console.log('[handleissues] error is ' + error);
    }

}

const noMantisUsersData = (name) => {
    const todayDate = new Date().toISOString().split('T')[0];

    // Define the path to the JSON file
    const filePath = `${CONSTANTS.ROOTDIR}/noMantisUsers.json`

    // Initialize an empty object to store the data
    let noMantisUsers = {};

    // Check if the file exists and read the existing content
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        noMantisUsers = JSON.parse(fileContent);
    }

    // Initialize today's date key with an empty array if it doesn't exist
    if (!noMantisUsers[todayDate]) {
        noMantisUsers[todayDate] = [];
    }

    // Add the name to today's array if it's not already present
    if (!noMantisUsers[todayDate].includes(name)) {
        noMantisUsers[todayDate].push(name);
    }

    // Write the updated noMantisUsers back to the JSON file
    fs.writeFileSync(filePath, JSON.stringify(noMantisUsers, null, 2), 'utf-8');
}


const newDateFormat = (date) => {
    try {
        let monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentDate = date;
        return `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
    catch (error) {
        console.log("[handleIssues] error is " + error);
    }
}

const isOlderThanNDays = (updatedAt, n, notes) => {
    if (notes) {
        const note = notes[notes.length - 1].text;
        const futureTaskMatch = note.match(/FUTURE-TASK due on\s*`?(\d{1,2}-[A-Z]{3}-\d{4})`?/s);
        const onHoldMatch = note.match(/ON-HOLD till\s*`?(\d{1,2}-[A-Z]{3}-\d{4})`?/s);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureDate = futureTaskMatch ? new Date(futureTaskMatch[1]) : null;
        const onHoldDate = onHoldMatch ? new Date(onHoldMatch[1]) : null;
        if (futureDate || onHoldDate) {
            if (n == 14) today.setDate(today.getDate() - 3);
            return (futureDate && futureDate < today) || (onHoldDate && onHoldDate < today);
        }

    }
    const updatedDate = new Date(updatedAt);
    const currentDate = new Date();

    // Subtract 'n' days from today to get the comparison date
    const nDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - n));

    // Reset time components to 00:00:00 for accurate date-only comparison
    updatedDate.setHours(0, 0, 0, 0);
    nDaysAgo.setHours(0, 0, 0, 0);

    // Return true if the updated date is on or before the comparison date
    return updatedDate <= nDaysAgo;
};


// Function to call API with mantises and email
const callApiWithMantises = async (mantises, name, email, apiUrl) => {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, mantises }),
        });

        if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('[handleIssues] API call error:', error);
        return null;
    }
}

const getManagerEmail = (email) => {
    const registerUsers = fs.readFileSync(`${CONSTANTS.ROOTDIR}/registerUser.json`, 'utf8');
    const data = JSON.parse(registerUsers);
    return data[email].report_to;
} 
