const fs = require('fs');
exports.start = async (routeName, header, messageContainer, message) => {
    const priorityOrder = {
        immediate: 1,
        urgent: 2,
        high: 3,
        normal: 4,
        low: 5
    };

    const registered = `${CONSTANTS.ROOTDIR}/registerUser.json`;
    const userData = fs.readFileSync(registered);
    const users = JSON.parse(userData);

    const statusCategories = ['resolved'];

    const processIssues = () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        twoDaysAgo.setHours(0, 0, 0, 0);

        return message.content.data.issues
            .filter(issue => {
                const isResolved = issue.status.name === 'resolved';
                const updatedAt = new Date(issue.updated_at);
                const isOlderThanTwoDays = updatedAt < twoDaysAgo;
                return isResolved && isOlderThanTwoDays;
            })
            .sort((a, b) => priorityOrder[a.priority.name] - priorityOrder[b.priority.name])
            .map(({ id, summary, priority, severity, updated_at, project, handler }) => {
                const userEmail = handler.email;
                const reportingManagerEmail = users[userEmail]?.report_to[0];

                return {
                    id,
                    title: summary,
                    link: `https://tekmonks.mantishub.io/app/issues/${id}`,
                    channel: project.name,
                    priority: priority.name,
                    severity: severity.name,
                    class: null, // We'll set the class later
                    updatedAt: new Date(updated_at).toLocaleString(),
                    userEmail: userEmail,
                    reportingManagerEmail: reportingManagerEmail
                };
            });
    };

    let processedIssues = {};
    const issues = processIssues();

    // Organize issues by reporting manager and reset index for each manager
    const issuesByManager = issues.reduce((acc, issue) => {
        if (issue.reportingManagerEmail) {
            if (!acc[issue.reportingManagerEmail]) {
                acc[issue.reportingManagerEmail] = [];
            }
            const managerIssues = acc[issue.reportingManagerEmail];
            issue.index = managerIssues.length + 1; // Set the index for this issue
            issue.class = issue.index % 2 === 0 ? 'even-row' : 'odd-row'; // Set the class based on index
            managerIssues.push(issue);
        }
        return acc;
    }, {});

    processedIssues['resolved_mantis_issues_by_manager'] = issuesByManager;

    writeAndMoveFile(issuesByManager);
    message.addRouteDone(routeName);
    message.setGCEligible(true);
    messageContainer.add(message);
};

const writeAndMoveFile = async (data) => {
    const filePath = `${CONSTANTS.ROOTDIR}/resolvedMantisReport.json`;
    const destinationPath = `${CONSTANTS.ROOTDIR}/resolvedMantisesReport/resolvedMantisReport.json`; // Replace with the actual path

    // Write data to report.json file
    try {
        // Write data to report.json file synchronously
        if(Object.keys(data).length === 0){
            console.log('there is no resolve mantis which need to be close');
        }else{
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log('File written successfully.');

        // Move the file to the desired location synchronously
        fs.renameSync(filePath, destinationPath);
        console.log('File moved successfully.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
};
