const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

const axios = require('axios');
// Send Grid
const sgMail = require('@sendgrid/mail');

const API_KEY = functions.config().sendgrid.key;
const WELCOME_EMAIL_TEMPLATE_ID = functions.config().sendgrid.welcomeemailtemplate;
const CHANGE_PASSWORD_EMAIL_TEMPLATE_ID = functions.config().sendgrid.changepasswordtemplate;
sgMail.setApiKey(API_KEY);

// Cloud Functions Config - How it works
// In order for Cloud Functions to use config vars we need to set them through the CLI
// example: firebase functions:config:set sendgrid.key=YOUR_KEY sendgrid.template=TEMPLATE_ID
// Here we are setting sendgrid API key and template

// Cloud Functions Config - Local config vars
// When testing we might also want to set config vars. We can do this by adding or changing the values in the .runtimeconfig.json file
// We can also generate this file by running this in the CLI: firebase functions:config:get > .runtimeconfig.json

// Commands
// npm run serve (create firebase emulator to test routes and functions. Use Postman to hit endpoints and see if function works correctly)
// firebase deploy --only functions (deploy these functions to firebase to be used in production app)
// firebase functions:log (to see log output from Firebase, same as can be found in the Firebase console)
// firebase emulators:start --only functions (test functions locally)

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions


///! TEST
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

///! TEST
// Take the text parameter passed to this HTTP endpoint and insert it into 
// Firestore under the path /messages/:documentId/original
// exports.addMessage = functions.https.onRequest(async (req, res) => {
//   // Grab the text parameter.
//   const original = req.query.text;
//   // Push the new message into Firestore using the Firebase Admin SDK.
//   const writeResult = await admin.firestore().collection('messages').add({original: original});
//   // Send back a message that we've successfully written the message
//   res.json({result: `Message with ID: ${writeResult.id} added.`});
// });

///* Test email sent when we hit the http end point
// exports.testWelcomeEmail = functions.https.onRequest(async (req, res) => {

//   /// Username and userEmail from request params
//   const username = req.query.username;
//   const email = req.query.email;

//   const msg = {
//     to: email,
//     from: { name: 'Linggo', email: 'hello@linggo.io' },
//     template_id: WELCOME_EMAIL_TEMPLATE_ID,
//     dynamic_template_data: {
//       subject: 'Welcome to Linggo!',
//       name: username,
//       user_email: email,
//       user_name: username,
//       Sender_Name: 'Linggo',
//       Sender_Address: 'London',
//       Sender_City: 'UK',
//     },
//     asm: {
//       group_id: 15276,
//     },
//     mailSettings: {
//       bypass_list_management: {
//         enable: true,
//       },
//     }
//   };
  
//   sgMail
//     .send(msg)
//     .then(() => { console.log('Email sent'); })
//     .catch((error) => { console.error(error); console.log(error.response.body); return res.status(400).json(error).end(); });
//   res.status(200).send().end();
// });

// Send email to user after signup
exports.welcomeEmail = functions.auth.user().onCreate(async (user) => {

  // Because of the way Firebase creates new account (by only taking email and password), we need to update user displayName afterwards.
  // Here we are getting user data from auth again so that it has the updated displayName so we can use it in email
  let userData = await admin.auth().getUser(user.uid);

  // Anonymous users do not have emails so we cannot send emails to them
  if (userData.email == undefined) { return; }

  const msg = {
    to: userData.email,
    from: { name: 'Linggo', email: 'hello@linggo.io' },
    templateId: WELCOME_EMAIL_TEMPLATE_ID,
    dynamic_template_data: {
      subject: 'Welcome to Linggo!',
      name: userData.displayName, // use updated displayName
      user_email: userData.email,
      user_name: userData.displayName,
      Sender_Name: 'Linggo',
      Sender_Address: 'London',
      Sender_City: 'UK',
    },
    asm: {
      group_id: 15276, // When clicking 'Unsubscribe' this is the group the user will be unsubscribing from
    },
    mailSettings: {
      bypass_list_management: { // this setting ensures that we still send this email to users who have unsubscribed from emails
        enable: true,
      },
    }
  };

  sgMail.send(msg);
});

/// Send an email when user sucessfully changes their password (either through settings page or via resetting their password)
exports.changePasswordSuccess = functions.https.onRequest(async (req, res) => {

  /// Get uid and email from query params. Then load userData from Firebase with this uid
  /// When user is logged in and change their password we have access to their uid. When they are not logged in and reset their password we only have access to their email.
  const uid = req.query.uid;
  const email = req.query.email;
  
  var userData;
  
  if (uid) { userData = await admin.auth().getUser(uid); }
  else if (email) { userData = await admin.auth().getUserByEmail(email); }
  else { console.log('uid and email not supplied. Cannot send email.'); return; }

  // Anonymous users do not have emails so we cannot send emails to them (this should not happen for this email but have this check just in case)
  if (userData.email == undefined) { return; }

  const msg = {
    to: userData.email,
    from: { name: 'Linggo', email: 'hello@linggo.io' },
    template_id: CHANGE_PASSWORD_EMAIL_TEMPLATE_ID,
    dynamic_template_data: {
      subject: 'Password Changed',
      name: userData.displayName,
      user_email: userData.email,
      user_name: userData.displayName,
      Sender_Name: 'Linggo',
      Sender_Address: 'London',
      Sender_City: 'UK',
    },
    asm: {
      group_id: 15276,
    },
    mailSettings: {
      bypass_list_management: {
        enable: true,
      },
    }
  };
  
  sgMail
    .send(msg)
    .then(() => { console.log('Email sent'); })
    .catch((error) => { console.error(error); console.log(error.response.body); });
  res.status(200).send().end();
});

// How to send verification email and password reset emails:
// If we wanted to send a verifcation email to user we would run this method admin.auth().generateEmailVerificationLink()
// Within that method we need to specify certain info about the email we want to send. To which domain, language, etc.
// Then we need a website that uses the Firebase Javascript SDK to receive it
// The user would be directed to thie website. Then we would need code to check the link we have received and tell Firebase about it
// This should then verify this user using Firebase auth.

// We would use this similar method for resetting passwords and the like

// This is how to generate emails for verifications ( admin.auth().generateEmailVerificationLink() ) 
// https://firebase.google.com/docs/auth/admin/email-action-links#generate_email_verification_link

// Set up custom email action handler (my own site)
// https://firebase.google.com/docs/auth/custom-email-handler


/*

mailSettings: {
  bypass_list_management: {
    enable: true,
  },
}

These arguments ensure that users that have opted out (unsubscribed) from our emails still receive.
We should be sure to do this only when needed to as to not annoy users who have said they do not want them.
The only times we should use them are when user has requested an email or it is necessary.
For example: welcome email, verifcation emails, password reset emails, etc.


asm: {
  group_id: 15276,
  groups_to_display: [
    15276
  ],
},

ASM (Advanced Suppression Management) is used for Subscription Tracking. Used for targeting who to send this email too (in which groups).
group_id is the the group id you want to send the email to. For example the Newsletter group is 15277
groups_to_display are the list of groups you want to display when the user clicks the Unsubscribe Preferences button in the email. We can leave this blank because all our groups are displayed by default.

*/

///* test function to send a FCM to ALL users
// exports.testSendToAll = functions.https.onRequest(async(req, res) => {
//   /// Get ALL users from database
//   var allUsers = await axios.get('https://www.api.linggo.io/api/db/user/token/all', { headers: { 'secret': functions.config().cloud_func.secret } });

//   /// Convert response to array
//   var jsonStr = JSON.stringify(allUsers.data);
//   var users = JSON.parse(jsonStr);

//   /// For each user
//   users.forEach(function(user) {
//     /// For each user FCM tokens
//     user.fcmTokens.forEach(async function(token) {
//       await admin.messaging().sendToDevice(
//         token,
//         {
//           notification: {
//             title: 'Test Message',
//             body: `This is a test message...`
//           }
//         },
//         {
//           contentAvailable: true,
//           priority: 'high'
//         }
//       ).then((response) => {
//         // console.log('Successfully sent message:', response);
//       }).catch((error) => {
//         // console.log('Error sent message:', error);
//         /// For these reasons and maybe others we should remove this token from user's token array
//         if (error.code == 'messaging/invalid-recipient' || error.code == 'messaging/invalid-registration-token' || error.code == 'messaging/registration-token-not-registered') {
//           axios.post('https://www.api.linggo.io/api/db/user/token/remove-token', null, { headers: { 'secret': functions.config().cloud_func.secret, 'uid': user.uid, 'fcmToken': token } });
//         }
//       });
//     });
//   });
//   res.status(200).send();
// });

///* test function to send FCM to specific device. Also get user data so that we can customise the message
// exports.testFunc = functions.https.onRequest( async (req, res) => {

//   // Get JWT Token so we can talk to server
//   var response = await axios.get('https://www.api.linggo.io/api/auth/token', { headers: { 'secret': functions.config().cloud_func.secret, 'uid': 'a4meJdw8FlQ9dCNA9LcgDWdCqfB3', 'deviceId': '1', 'exp': '1h' } });
//   let token = response.data.token;
//   // console.log(`token: ${token}`);

//   /// Get user data
//   var response2 = await axios.get('https://www.api.linggo.io/api/db/user/global/a4meJdw8FlQ9dCNA9LcgDWdCqfB3', { headers: { 'x-auth-token': token } });
//   // console.log(response2);
//   let username = response2.data.username;
//   console.log(`username: ${username}`);

//   /// Send customised notification to them
//   await admin.messaging().sendToDevice(
//     'eIX2wgXcTweH-TEx9HMIu_:APA91bFW7rsh1KoVz9zsUXLxygZcTF57qU5gfSxOamU1-jSsRZ8c2BdJSyBLzmJy1Y8L6AeLQaUQK9EVLrMQbRKrYvWcR1koZ0l6wEMAOF63JJ5pxIddjN4Mxyiarol6e0PpW_lIEA3w',
//     {
//       notification: {
//         title: getTitle(),
//         body: `Please enter your credit card details...`
//       }
//     },
//     {
//       contentAvailable: true,
//       priority: 'high'
//     }
//   );

//   res.status(200).send().end();
// });

// /// Testing to make sure we can do things like this where we randomise the message text
// function getTitle() {
//   return 'New Title';
// }


/// Review Notification scheduler. Runs every hour and sends review notifications to users in their local time.
exports.reviewNotificationScheduler = functions.pubsub.schedule('0 * * * *').onRun(async (context) => {
  /// Get all users that need to be notified now
  var allUsers = await axios.get('https://www.api.linggo.io/api/db/user/token/get-users-review-notifications', { headers: { 'secret': functions.config().cloud_func.secret } });
  /// Convert response to array
  var jsonStr = JSON.stringify(allUsers.data);
  var users = JSON.parse(jsonStr);

  /// For each user
  users.forEach(function(user) {
    /// For each user FCM tokens
    user.fcmTokens.forEach(async function(token) {
      await admin.messaging().sendToDevice(
        token,
        {
          notification: {
            body: `你好! It's time for your Chinese lesson! Let's go!`
          }
        },
        {
          contentAvailable: true,
          priority: 'high'
        }
      ).then((response) => {
        // console.log('Successfully sent message:', response);
        // console.log('Successfully sent message to user:', user.uid);
      }).catch((error) => {
        console.log('Error sent message:', error);
        console.log('Error sent message to user:', user.uid);
        /// For these reasons and maybe others we should remove this token from user's token array
        if (error.code == 'messaging/invalid-recipient' || error.code == 'messaging/invalid-registration-token' || error.code == 'messaging/registration-token-not-registered') {
          axios.post('https://www.api.linggo.io/api/db/user/token/remove-token', null, { headers: { 'secret': functions.config().cloud_func.secret, 'uid': user.uid, 'fcmToken': token } });
        }
      });
    });
  });
});

/// Send notification to users that have not logged in between 3-6 days
exports.threeDaysAwayNotificationScheduler = functions.pubsub.schedule('0 * * * *').onRun(async (context) => {
  var results = await axios.get('https://www.api.linggo.io/api/db/user/token/get-users-days-away', { headers: { 'secret': functions.config().cloud_func.secret, 'lower': 3, 'upper': 6 } });
  var jsonStr = JSON.stringify(results.data);
  var users = JSON.parse(jsonStr);

  /// For each user
  users.forEach(function(user) {
    /// For each user FCM tokens
    user.fcmTokens.forEach(async function(token) {
      await admin.messaging().sendToDevice(
        token,
        {
          notification: {
            title: `Let's review!`,
            body: `You've not practiced Chinese in while. Let's do a lesson now!`
          }
        },
        {
          contentAvailable: true,
          priority: 'high'
        }
      ).then((response) => {
        // console.log('Successfully sent message:', response);
        // console.log('Successfully sent message to user:', user.uid);
      }).catch((error) => {
        console.log('Error sent message:', error);
        console.log('Error sent message to user:', user.uid);
        /// For these reasons and maybe others we should remove this token from user's token array
        if (error.code == 'messaging/invalid-recipient' || error.code == 'messaging/invalid-registration-token' || error.code == 'messaging/registration-token-not-registered') {
          axios.post('https://www.api.linggo.io/api/db/user/token/remove-token', null, { headers: { 'secret': functions.config().cloud_func.secret, 'uid': user.uid, 'fcmToken': token } });
        }
      });
    });
  });
});

/// Send notification to users that have not logged in between 7-10 days
exports.sevenDaysAwayNotificationScheduler = functions.pubsub.schedule('0 * * * *').onRun(async (context) => {
  var results = await axios.get('https://www.api.linggo.io/api/db/user/token/get-users-days-away', { headers: { 'secret': functions.config().cloud_func.secret, 'lower': 7, 'upper': 10 } });
  var jsonStr = JSON.stringify(results.data);
  var users = JSON.parse(jsonStr);

  /// For each user
  users.forEach(function(user) {
    /// For each user FCM tokens
    user.fcmTokens.forEach(async function(token) {
      await admin.messaging().sendToDevice(
        token,
        {
          notification: {
            title: `Let's review!`,
            body: `You've been away for a while. Let's brush up on your Chinese skills!`
          }
        },
        {
          contentAvailable: true,
          priority: 'high'
        }
      ).then((response) => {
        // console.log('Successfully sent message:', response);
        // console.log('Successfully sent message to user:', user.uid);
      }).catch((error) => {
        console.log('Error sent message:', error);
        console.log('Error sent message to user:', user.uid);
        /// For these reasons and maybe others we should remove this token from user's token array
        if (error.code == 'messaging/invalid-recipient' || error.code == 'messaging/invalid-registration-token' || error.code == 'messaging/registration-token-not-registered') {
          axios.post('https://www.api.linggo.io/api/db/user/token/remove-token', null, { headers: { 'secret': functions.config().cloud_func.secret, 'uid': user.uid, 'fcmToken': token } });
        }
      });
    });
  });
});