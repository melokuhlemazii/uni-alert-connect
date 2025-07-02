const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

admin.initializeApp();
const db = admin.firestore();

// Configure SendGrid and Twilio (set your API keys in environment variables)
sgMail.setApiKey(functions.config().sendgrid.key);
const twilioClient = twilio(functions.config().twilio.sid, functions.config().twilio.token);
const twilioFrom = functions.config().twilio.from;

exports.sendAlertNotifications = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    const usersSnapshot = await db.collection('users').get();
    const promises = [];
    usersSnapshot.forEach(userDoc => {
      const user = userDoc.data();
      const prefs = user.alertPrefs || {};
      const alertTypeKey = `${alert.type}Alerts`;
      const shouldSend = prefs[alertTypeKey];
      // Always send SMS if cellphone exists
      if (user.cellphone) {
        promises.push(
          twilioClient.messages.create({
            body: alert.message,
            from: twilioFrom,
            to: user.cellphone
          })
        );
      }
      // Send email if enabled
      if (shouldSend && prefs.emailNotifications && user.email) {
        promises.push(
          sgMail.send({
            to: user.email,
            from: 'noreply@yourdomain.com',
            subject: alert.title || 'New Alert',
            text: alert.message,
          })
        );
      }
      // Send push notification if enabled (implement push logic as needed)
      if (shouldSend && prefs.pushNotifications && user.pushToken) {
        // Implement push notification logic here
      }
    });
    await Promise.all(promises);
    return null;
  });
