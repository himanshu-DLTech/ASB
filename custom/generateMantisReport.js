const fs = require('fs');
const path = require('path');
exports.start = async (routeName, header, messageContainer, message) => {
    try {
      // Get the issues from the message
      const registerUserData = fs.readFileSync(`${CONSTANTS.ROOTDIR}/registerUser.json`);
      const registerUsers = JSON.parse(registerUserData);
      const issues = message.content.data.issues;
  
      const openIssuesByUser = {};
      const notesByUser = {}; 
      const prCountsByUser = {};

      const today = new Date();
      today.setDate(today.getDate()-1);
      const date=today.toISOString().split('T')[0];

      issues.forEach((issue) => {
        if (issue.created_at.split('T')[0] === date) {
          const id = issue.reporter.id;      
          const user = Object.values(registerUsers).find(user => user.id === id);
          if (user) {
            if (!openIssuesByUser[user.name]) {
              openIssuesByUser[user.name] = {
                count: 0,
                role: user.role
              };
            }
            openIssuesByUser[user.name].count++;
          }
        }
      
        if (issue.notes) {
          issue.notes.forEach((note) => {
            if (note.updated_at.split('T')[0] === date) {
              const id = note.reporter.id;
              const user = Object.values(registerUsers).find(user => user.id === id);
              const email = Object.keys(registerUsers).find(email => registerUsers[email] === user);
      
              if (user) {
                // Update notesByUser
                if (!notesByUser[user.name]) {
                  notesByUser[user.name] = {
                    count: 0,
                    role: user.role
                  };
                }
                notesByUser[user.name].count++;
      
                // Update prCountsByUser
                if (!prCountsByUser[email]) {
                  prCountsByUser[email] = {
                    prSet: new Set(),
                    name:user.name,
                    role: user.role
                  };
                }
                const matches = note.text.match(/https:\/\/github\.com\/.*?\/pull\/\d+/g);
                if (matches) {
                  matches.forEach(match => prCountsByUser[email].prSet.add(match));
                }
              }
            }
          });
        }
      });


      let existingData = {};
      const allLinks = new Set();
      const fileName = `${CONSTANTS.ROOTDIR}/mantisReport.json`;

      if (fs.existsSync(fileName)) {
        const fileContent = fs.readFileSync(fileName, 'utf8');
        existingData = JSON.parse(fileContent);
        Object.values(existingData).forEach(dateData => {
          dateData.usersPR.forEach(user => {
            user.links.forEach(link => allLinks.add(link));
          });
        });
      }

      function addUniqueLink(link) {
        if (!allLinks.has(link)) {
          allLinks.add(link);
          return true;
        }
        return false;
      }

      const openIssues = Object.entries(openIssuesByUser)
      .map(([name,data]) =>{
        return{
          name:name,
          count:data.count,
          role: data.role
        }; 
      });
      
      const userNotes = Object.entries(notesByUser)
      .map(([name,data]) =>{
        return{
          name:name,
          count:data.count,
          role: data.role
        }; 
      });
      
      const usersPR = Object.entries(prCountsByUser)
      .filter(([email, data]) => data.prSet.size > 0) 
      .map(([email, data]) => {
        const uniqueLinks = Array.from(data.prSet).filter(addUniqueLink);
        return {
          email:email,
          name:data.name,
          count: uniqueLinks.length,
          role: data.role,
          links: uniqueLinks
        };
      });

      // Create the data object
      const data = {
        [date]: {
          openIssues,
          userNotes,
          usersPR
        }
      };

      // Merge new data with existing data
      const updatedData = { ...existingData, ...data };

      // Write the updated data to the file
      fs.writeFileSync(fileName, JSON.stringify(updatedData, null, 2)); 

    message.addRouteDone(routeName);
    message.setGCEligible(true);
    } catch (error) {
      console.error('Error in processing issues:', error);
    }
  };



  
