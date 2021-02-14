const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

// Send Grid
const sgMail = require('@sendgrid/mail');

const API_KEY = functions.config().sendgrid.key;
const WELCOME_EMAIL_TEMPLATE_ID = functions.config().sendgrid.welcomeemailtemplate;
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


// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// Take the text parameter passed to this HTTP endpoint and insert it into 
// Firestore under the path /messages/:documentId/original
exports.addMessage = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push the new message into Firestore using the Firebase Admin SDK.
  const writeResult = await admin.firestore().collection('messages').add({original: original});
  // Send back a message that we've successfully written the message
  res.json({result: `Message with ID: ${writeResult.id} added.`});
});

/// Test email sent when we hit the http end point
exports.testWelcomeEmail = functions.https.onRequest(async (req, res) => {

  /// Username and userEmail from request params
  const username = req.query.username;
  const email = req.query.email;

  const msg = {
    to: email,
    from: 'hello@linggo.io',
    template_id: WELCOME_EMAIL_TEMPLATE_ID,
    dynamic_template_data: {
      subject: 'Welcome to Linggo!',
      name: username,
      user_email: email,
      user_name: username,
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
    .then(() => { console.log('Email sent'); return res.status(200); })
    .catch((error) => { console.error(error); console.log(error.response.body); return res.status(400).json(error); });
  res.status(200).send().end();
});

// Send email to user after signup
exports.welcomeEmail = functions.auth.user().onCreate(async (user) => {

  // Because of the way Firebase creates new account (by only taking email and password), we need to update user displayName afterwards.
  // Here we are getting user data from auth again so that it has the updated displayName so we can use it in email
  let userData = await admin.auth().getUser(user.uid);

  const msg = {
    to: userData.email,
    from: 'hello@linggo.io',
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