const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// This function triggers when a new alert is created
exports.sendAlertNotifications = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    const alertId = context.params.alertId;
    
    console.log('New alert created:', alertId, alert);
    
    try {
      // Get all users who are subscribed to this module
      const userSubscriptionsSnapshot = await db.collection('userSubscriptions').get();
      const notificationPromises = [];
      
      for (const userDoc of userSubscriptionsSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Check if user is subscribed to this module
        if (userData.modules && userData.modules[alert.moduleId]) {
          // Get user profile to check preferences and contact info
          const userProfileDoc = await db.collection('users').doc(userId).get();
          
          if (userProfileDoc.exists()) {
            const userProfile = userProfileDoc.data();
            const alertPrefs = userProfile.alertPrefs || {};
            
            // Determine if user should receive this alert based on preferences
            const shouldReceiveAlert = shouldUserReceiveAlert(alert.type, alertPrefs);
            
            if (shouldReceiveAlert) {
              // Always send SMS if cellphone is provided (regardless of other preferences)
              if (userProfile.cellphone) {
                notificationPromises.push(
                  sendSMSNotification(userProfile.cellphone, alert)
                );
              }
              
              // Send email if email notifications are enabled
              if (alertPrefs.emailNotifications && userProfile.email) {
                notificationPromises.push(
                  sendEmailNotification(userProfile.email, alert)
                );
              }
              
              // Send push notification if enabled
              if (alertPrefs.pushNotifications && userProfile.fcmToken) {
                notificationPromises.push(
                  sendPushNotification(userProfile.fcmToken, alert)
                );
              }
              
              // Create notification record in Firestore for real-time updates
              notificationPromises.push(
                createNotificationRecord(userId, alert, alertId)
              );
            }
          }
        }
      }
      
      // Execute all notification promises
      await Promise.allSettled(notificationPromises);
      console.log(`Sent notifications for alert ${alertId}`);
      
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  });

// Helper function to determine if user should receive alert based on preferences
function shouldUserReceiveAlert(alertType, alertPrefs) {
  // Default to true if no preferences set
  if (!alertPrefs) return true;
  
  switch (alertType) {
    case 'exam':
      return alertPrefs.examAlerts !== false;
    case 'test':
      return alertPrefs.testAlerts !== false;
    case 'assignment':
      return alertPrefs.assignmentAlerts !== false;
    case 'general':
      return alertPrefs.generalAlerts !== false;
    default:
      return alertPrefs.generalAlerts !== false;
  }
}

// SMS notification function (placeholder - integrate with your SMS service)
async function sendSMSNotification(phoneNumber, alert) {
  try {
    // Example using Twilio (you'll need to configure Twilio credentials)
    // const twilio = require('twilio');
    // const client = twilio(functions.config().twilio.sid, functions.config().twilio.token);
    
    const message = `${alert.title}\n${alert.description}\nModule: ${alert.moduleName}`;
    
    // For now, just log the SMS (replace with actual SMS service)
    console.log(`SMS to ${phoneNumber}: ${message}`);
    
    // Uncomment and configure when you have SMS service set up:
    /*
    await client.messages.create({
      body: message,
      from: functions.config().twilio.from,
      to: phoneNumber
    });
    */
    
    return { success: true, type: 'sms', recipient: phoneNumber };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, type: 'sms', recipient: phoneNumber, error: error.message };
  }
}

// Email notification function (placeholder - integrate with your email service)
async function sendEmailNotification(email, alert) {
  try {
    // Example using SendGrid (you'll need to configure SendGrid)
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(functions.config().sendgrid.key);
    
    const emailContent = {
      to: email,
      from: 'noreply@uni-alert.com',
      subject: `${alert.title} - ${alert.moduleName}`,
      text: alert.description,
      html: `
        <h2>${alert.title}</h2>
        <p><strong>Module:</strong> ${alert.moduleName}</p>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p>${alert.description}</p>
      `
    };
    
    // For now, just log the email (replace with actual email service)
    console.log(`Email to ${email}:`, emailContent);
    
    // Uncomment and configure when you have email service set up:
    /*
    await sgMail.send(emailContent);
    */
    
    return { success: true, type: 'email', recipient: email };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, type: 'email', recipient: email, error: error.message };
  }
}

// Push notification function
async function sendPushNotification(fcmToken, alert) {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: alert.title,
        body: alert.description
      },
      data: {
        alertId: alert.id || '',
        moduleId: alert.moduleId || '',
        type: alert.type || 'general'
      }
    };
    
    await admin.messaging().send(message);
    return { success: true, type: 'push', recipient: fcmToken };
  } catch (error) {
    console.error('Push notification failed:', error);
    return { success: false, type: 'push', recipient: fcmToken, error: error.message };
  }
}

// Create notification record for real-time updates
async function createNotificationRecord(userId, alert, alertId) {
  try {
    await db.collection('notifications').add({
      userId,
      alertId,
      title: alert.title,
      description: alert.description,
      type: alert.type,
      moduleId: alert.moduleId,
      moduleName: alert.moduleName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    
    return { success: true, type: 'notification_record', recipient: userId };
  } catch (error) {
    console.error('Failed to create notification record:', error);
    return { success: false, type: 'notification_record', recipient: userId, error: error.message };
  }
}