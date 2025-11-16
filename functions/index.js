const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.cleanupInactiveUsers = functions.pubsub.schedule("every 24 hours").onRun(async () => {
  const db = admin.database();
  const ids = await db.ref("ids").once("value");
  const now = Date.now();
  const cutoff = 5 * 24 * 60 * 60 * 1000;

  const updates = {};

  ids.forEach(child=>{
    const data = child.val();
    const last = data.lastActive || 0;

    if(now - last > cutoff){
      updates[child.key] = null;   // remove user
      console.log("Removed inactive:", child.key);
    }
  });

  await db.ref("ids").update(updates);
  return null;
});
