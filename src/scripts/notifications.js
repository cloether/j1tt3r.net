// Check if browser supports notifications.
if ('Notification' in window) {
  window.addEventListener('load', () => {
    // first check if we have notification permission, if not ask for it.
    if (window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission((status) => {
        if (Notification.permission !== status) {
          Notification.permission = status;
        }
      }).then(value => {
        console.debug(value)
      });
    }
  });
} else {
  console.warn('This browser does not support notifications.');
}

// noinspection JSUnusedGlobalSymbols
/**
 * Request Notification Permission
 *
 * @return {Promise<void>}
 */
const requestNotificationPermission = () => {
  return new Promise((resolve, reject) => {
    const permissionResult = Notification.requestPermission((result) => {
      // Handling deprecated version with callback.
      resolve(result);
    });

    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  }).then((permissionResult) => {
    // value of permission can be 'granted', 'default', 'denied'
    // - granted: user has accepted the request
    // - default: user has dismissed the notification permission popup by
    // clicking on x - denied: user has denied the request.
    if (permissionResult !== 'granted') {
      throw new Error(`Permission not granted for Notification: ${permissionResult}`)
    }
  });
}
