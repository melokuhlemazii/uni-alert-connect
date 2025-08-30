const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// SMS service configuration (you'll need to set up with a provider like Twilio)
// For now, this is a placeholder that logs SMS messages
const sendSMS = async (phoneNumber, message) => {
  try {
    // TODO: Replace with actual SMS service integration
    console.log(`SMS to ${phoneNumber}: ${message}`);
    
    // Example Twilio integration (uncomment and configure):
    /*
    const twilio = require('twilio');
    const client = twilio(
      functions.config().twilio.account_sid,
      functions.config().twilio.auth_token
    );
    
    await client.messages.create({
      body: message,
      from: functions.config().twilio.phone_number,
      to: phoneNumber
    });
    */
    
    return { success: true };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Function to send SMS notifications when alerts are created
exports.sendSMSNotifications = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    const alertId = context.params.alertId;
    
    console.log('New alert created, sending SMS notifications:', alertId);
    
    try {
      // Get all users subscribed to this module
      const userSubscriptionsSnapshot = await db.collection('userSubscriptions').get();
      const smsPromises = [];
      
      for (const userDoc of userSubscriptionsSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Check if user is subscribed to this module
        if (userData.modules && userData.modules[alert.moduleId]) {
          // Get user profile to check for cellphone number
          const userProfileDoc = await db.collection('users').doc(userId).get();
          
          if (userProfileDoc.exists()) {
            const userProfile = userProfileDoc.data();
            
            // Send SMS if cellphone is provided (always send SMS regardless of other preferences)
            if (userProfile.cellphone) {
              const message = `${alert.title}\n${alert.description}\nModule: ${alert.moduleName}`;
              smsPromises.push(sendSMS(userProfile.cellphone, message));
            }
            
            // Create notification record for real-time updates
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
          }
        }
      }
      
      // Execute all SMS promises
      const results = await Promise.allSettled(smsPromises);
      console.log(`SMS notifications sent for alert ${alertId}:`, results);
      
    } catch (error) {
      console.error('Error sending SMS notifications:', error);
    }
  });

// Function to automatically clean up expired alerts
exports.cleanupExpiredAlerts = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    console.log('Running cleanup of expired alerts...');
    
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Find alerts that have passed their scheduled time
      const expiredAlertsQuery = await db.collection('alerts')
        .where('scheduledAt', '<=', now)
        .get();
      
      const deletePromises = [];
      expiredAlertsQuery.forEach((doc) => {
        console.log('Deleting expired alert:', doc.id);
        deletePromises.push(doc.ref.delete());
      });
      
      // Find events that are more than 1 day old
      const oneDayAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      const expiredEventsQuery = await db.collection('events')
        .where('date', '<=', oneDayAgo)
        .get();
      
      expiredEventsQuery.forEach((doc) => {
        console.log('Deleting expired event:', doc.id);
        deletePromises.push(doc.ref.delete());
      });
      
      await Promise.all(deletePromises);
      console.log(`Cleaned up ${deletePromises.length} expired items`);
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });