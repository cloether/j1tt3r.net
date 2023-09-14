const {clients, addEventListener, skipWaiting, registration} = self;

/** @const {Array.<string>} */
const BLACKLIST = [];

/** @const {string} */
const CACHE_NAME = "CACHE-V1";

/** @const {string} */
const DATA_CACHE_NAME = "DATA-V1";

/** @const {string} */
const DATA_URL = "https://www.j1tt3r.net/";

/** @const {Array.<string>} */
const FILE_TO_CACHE = [
  "/index.html",
  "/favicon.ico",
  "/images/incognito.svg",
  "/images/incognito.jpg",
  "/style/index.css",
  "/style/normalize.css"
];

// noinspection JSUnusedGlobalSymbols
/**
 * isClientFocused
 *
 * @description TODO
 *
 * @return {Promise<boolean>}
 */
function isClientFocused() {
  // noinspection JSUnresolvedVariable
  return clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let clientIsFocused = false;
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.focused) {
        clientIsFocused = true;
        break;
      }
    }
    return clientIsFocused;
  });
}

/**
 * Push Received Tracking
 *
 * @param {TrackEvent} event - Tracking event to handle.
 *
 * @description Send Tracking Event for Push Notification
 *
 * @link TODO: Add Link(s)
 *
 * @return {Promise<void>}
 */
const pushReceivedTracking = (event) => {
  console.debug("[ServiceWorker] Push: Received Tracking Event", event);
  // noinspection JSUnusedLocalSymbols
  return new Promise((resolve, reject) => resolve(true));
};

/**
 * Notification Close Tracking
 *
 * @description Send Tracking Event for Push Notification
 *
 * @link TODO: Add Link(s)
 *
 * @return {Promise<void>}
 */
const notificationCloseTracking = (event) => {
  console.debug("[ServiceWorker] Notification: Close Tracking Event", event);
  // noinspection JSUnusedLocalSymbols
  return new Promise((resolve, reject) => resolve(true));
};

/**
 * Push Fetch Info
 *
 * @description Fetch Push Notification Info
 *
 * @link TODO: Add Link(s)
 *
 * @param {string} url
 *
 * @return {Promise<Object>}
 */
const pushFetchInfo = (url) => {
  console.debug("[ServiceWorker] Fetching Push Info", url);
  // noinspection JSUnusedLocalSymbols
  return new Promise((resolve, reject) => resolve({
    tag: "push-notification",
    icon: "/images/incognito.svg"
  }));
};

/**
 * Activate Listener
 *
 * @link TODO: Add Link(s)
 * @description Register event listener for the 'activate' event.
 *
 * @return {Promise<boolean>}
 */
addEventListener("activate", (event) => {
  console.debug("[ServiceWorker] Activate");
  event.waitUntil(caches.keys().then((keys) => {
    return Promise.all(keys.map((key) => {
      if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
        console.debug("[ServiceWorker] Cache Delete", key);
        return caches.delete(key);
      } else {
        return Promise.resolve(false)
      }
    }))
  }))

  /**
   * Fixes a corner case in which the app wasn't returning the latest data.
   *
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps:
   *
   *    1) load app for first time so the initial data is shown
   *    2) press the refresh button on the app
   *    3) go offline
   *    4) reload the app. You expect to see the newer data, but you
   *       actually see the initial data. This happens because the service
   *       worker is not yet activated. The code below essentially lets you
   *       activate the service worker faster.
   */
  return clients.claim();
});

// noinspection LongLine
/**
 * Fetch Listener
 *
 * @description Register event listener for the 'fetch' event.
 *
 *  "Cache Then Network" Strategy
 *
 *    When the request URL contains dataUrl, the app is asking for fresh data.
 *    In this case, the service worker always goes to the network and then
 *    caches the response.
 *
 *    @link https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
 *
 *  "Offline" Strategy
 *
 *    The app is asking for app shell files. In this scenario the app uses the
 *    "Cache, falling back to the network" offline strategy.
 *
 *    @link https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
 *
 * @return {Response}
 */
addEventListener("fetch", (event) => {
  console.debug("[ServiceWorker] Fetch", event.request.url);

  const {request} = event;

  // Always bypass for range requests, due to browser bugs
  if (request.headers.has('range')) {
    return new Response();
  }

  // check blacklist
  for (let [, item] of BLACKLIST.entries()) {
    if (request.url.indexOf(item) >= 0) {
      console.debug("[ServiceWorker] Blacklist", request.url);
      return new Response()
    }
  }

  // if this was a navigation show the offline page
  //
  // if (request.mode === 'navigate') {
  //   return caches.match('index.html');
  // }

  if (request.url.indexOf(DATA_URL) > -1) {
    return cacheThenNetwork(event)
  } else {
    return offlineStrategy(event)
  }
});

/**
 * Install Listener
 *
 * @param {FetchEvent} event - Fetch event to handle.
 *
 * @description Register event listener for the 'install' event.
 *
 * @link TODO: Add Link(s)
 *
 * @return {Promise<void>}
 */
addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => {
    console.debug("[ServiceWorker] Installing");
    return cache.addAll(FILE_TO_CACHE);
  }))
});

/**
 * Notification Click Listener
 *
 * @param {FetchEvent} event - Fetch event to handle.
 *
 * @description Add Description
 *
 * @link TODO: Add Link(s)
 */
addEventListener("notificationclick", (event) => {
  console.debug("[ServiceWorker] Notification (Click)", event.type);
  // close the notification popout
  event.notification.close();
  // get all the window clients
  event.waitUntil(clients.matchAll({type: 'window'}).then((clientsArray) => {
    // if a window tab matching targeted URL already exists, focus that
    const hadWindowToFocus = clientsArray.some((windowClient) => {
      // noinspection CommaExpressionJS
      return windowClient.url === event.notification.data.url
          ? (windowClient.focus(), true)
          : false
    });
    // otherwise, open a new tab to the applicable URL and focus it.
    if (!hadWindowToFocus) {
      // noinspection JSUnresolvedVariable
      clients.openWindow(event.notification.data.url)
          .then((windowClient) => windowClient ? windowClient.focus() : null)
          .catch((reason) => console.debug(
              "[ServiceWorker] Failed to openWindow", reason
          ))
    }
  }));
});

/**
 * Notification Close Listener
 *
 * @param {FetchEvent} event - Fetch event to handle.
 *
 * @description Add Description
 *
 * @link TODO: Add Link(s)
 */
addEventListener('notificationclose', (event) => {
  console.debug("[ServiceWorker] Notification (Close)", event.type);
  // dismissed notification
  event.waitUntil(notificationCloseTracking(event.notification));
});

/**
 * Push Event Listener.
 *
 * @description Register event listener for the 'push' event.
 *
 *  Payload the text taken from event.data (a PushMessageData object)
 *  or a set default string if the data is empty, and waits until the
 *  notification is shown to the user.
 *
 *  Other formats are supported (ArrayBuffer, Blob, JSON).
 *
 * @param {FetchEvent} event - Fetch event to handle.
 *
 * @link https://serviceworke.rs/
 * @link https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData.
 */
addEventListener("push", (event) => {
  console.debug("[ServiceWorker] Notification", event.type);
  const analyticsPromise = pushReceivedTracking(event);
  const pushInfoPromise = pushFetchInfo("/api/push").then((response) => {
    const timestamp = new Date(Date.now())
    return registration.showNotification("Notification", {
      actions: [
        {action: "yes", title: "Yes", icon: "\u2705"},
        {action: "no", title: "No", icon: "\u274c"}
      ],
      badge: "https://j1tt3r.net/images/incognito.jpg",
      body: event.data ? event.data.text() : "(No Payload)",
      dir: "ltr",
      data: {
        message: "Hi",
        url: "https://j1tt3r.net?fc=HI&fs=16",
        time: timestamp.toString()
      },
      icon: "https://j1tt3r.net/images/incognito.jpg",
      image: "https://j1tt3r.net/images/incognito.jpg",
      lang: "en",
      renotify: true,
      requireInteraction: true,
      silent: false,
      tag: response.tag,
      timestamp: Number(timestamp),
      vibrate: [
        125, 75, 125, 275, 200, 275, 125, 75, 125, 275, 200, 600, 200, 600
      ]
    });
  });
  // Keep the service worker alive until the notification is created.
  // Then show the notification.
  event.waitUntil(Promise.all([analyticsPromise, pushInfoPromise]));
});

/**
 * Push Subscription Change Listener
 *
 * @description Listen for pushsubscriptionchange events, which
 *  are fired when a subscription expires.  Subscribe again and
 *  register the new subscription with the server, by sending a
 *  POST request to an endpoint.
 *
 *  Real world application would probably use also user identification.
 *
 * @param {FetchEvent} event - Fetch event to handle.
 *
 * @link TODO: Add Link(s)
 */
addEventListener("pushsubscriptionchange", (event) => {
  console.debug("[ServiceWorker] Subscription Expired");
  event.waitUntil(registration.pushManager.subscribe({userVisibleOnly: true})
      .then((subscription) => {
        console.debug("[ServiceWorker] Subscribed After Expiration", subscription.endpoint);
        return fetch("register", {
          method: "post",
          headers: {"Content-type": "application/json"},
          body: JSON.stringify({endpoint: subscription.endpoint})
        });
      })
  );
});

// TODO: SyncEvent IS NOT STANDARD
//    References: https://developer.mozilla.org/en-US/docs/Web/API/SyncEvent
// noinspection JSValidateJSDoc
/**
 * Sync Listener
 *
 * @param {SyncEvent} event - Sync event to handle.
 *
 * @description Add Description
 *
 * @link TODO: Add Link(s)
 */
addEventListener("sync", (event) => {
  console.debug("[ServiceWorker] Sync", event.tag)
});

/**
 * Message Listener
 *
 * @param {MessageEvent} event - Message event to handle.
 *
 * @description ServiceWorker Message Handler
 *
 * @link TODO: Add Link(s)
 */
addEventListener("message", (event) => {
  console.debug("[ServiceWorker] Message From Client", event.data);
  event.waitUntil(event.source.postMessage("Hello From ServiceWorker", null));
});

/**
 * fetchFromNetworkAndCache
 *
 * @param {FetchEvent} event - Fetch event to handle.
 *
 * @return {Promise<*|void>|null}
 */
function fetchFromNetworkAndCache(event) {
  // DevTools opening will trigger these o-i-c requests, which this SW can't
  // handle. There's probably more going on here, but I'd rather just ignore
  // this problem. :)
  // https://github.com/paulirish/caltrainschedule.io/issues/49
  if (
      event.request.cache === 'only-if-cached'
      && event.request.mode !== 'same-origin'
  ) {
    return null;
  }

  return fetch(event.request).then(res => {
    // foreign requests may be res.type === 'opaque' and missing a url
    if (!res.url) {
      return res;
    }

    // regardless, we don't want to cache other origin's assets
    if (new URL(res.url).origin !== location.origin) {
      return res;
    }

    return caches.open(DATA_CACHE_NAME).then(cache => {
      // TODO: figure out if the content is new and
      //  therefore the page needs reloaded.
      cache.put(event.request, res.clone()).then(r => r);
      return res;
    });
  }).catch(err => console.error(event.request.url, err));
}

/**
 * handleNoCacheMatch
 *
 * @param {FetchEvent} event - Fetch event to handle.
 *
 * @return {null|Promise<*|void>}
 */
function handleNoCacheMatch(event) {
  return fetchFromNetworkAndCache(event)
}

/**
 * "Cache Then Network" Strategy
 *
 * @param {FetchEvent} event - Fetch event to handle.
 */
function cacheThenNetwork(event) {
  event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request).then((response) => {
          cache.put(event.request.url, response.clone()).then(() => (
              console.debug(
                  "[ServiceWorker] Fetch Cache Then Network:",
                  event.request.url
              )
          ));
          return response;
        });
      })
  );
}

/**
 * "Offline" Strategy
 *
 * @param {FetchEvent} event - Fetch event to handle.
 */
function offlineStrategy(event) {
  const request = event.request;
  event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((response) => {
          return caches.open(DATA_CACHE_NAME).then((cache) => {
            // noinspection JSIgnoredPromiseFromCall
            cache.put(request, response.clone());
            return response;
          });
        });
      })
  );
}
