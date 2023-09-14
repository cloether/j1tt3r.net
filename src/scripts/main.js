const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

window.addEventListener('online', (e) => {
  // TODO: Re-sync data with server.
  console.debug("[Message] Client Online", e)
}, false);

window.addEventListener('offline', (e) => {
  // TODO: Queue up events for server.
  console.debug("[Message] Client Offline", e)
}, false);

// Check if browser supports service workers.
if ('serviceWorker' in navigator) {
  /**
   * Send Message
   *
   * @description Use the postMessage interface to communicate with the service
   *   worker controlling the page.
   *
   * @link https://googlechrome.github.io/samples/service-worker/post-message/
   */
  window.addEventListener('load', function () {
    const swUrl = '/sw.js'

    if (isLocalhost) {
      // This is running on localhost. Let's check if a service worker still
      // exists or not.
      checkValidServiceWorker(swUrl);
      // Add some additional logging to localhost.
      navigator.serviceWorker.ready.then(() => {
        console.debug('This web app is being served cache-first by a service worker.');
      });
    } else {
      register(swUrl)
    }

    navigator.serviceWorker.addEventListener("controllerchange", (event) => {
      // This fires when the service worker controlling this page changes, eg a
      // new worker has skipped waiting and become the new active worker.
      console.debug('[ServiceWorker] Controller Change:', event);
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
      console.debug('[Message] ServiceWorker:', event.data)
    });

    window.addEventListener('beforeinstallprompt', (event) => {
      console.debug('[Install] beforeinstallprompt:', event)

      // For more details read:
      // http://www.html5rocks.com/en/tutorials/es6/promises/
      event["userChoice"].then((choice) => {
        console.debug("[Install] beforeinstallprompt Outcome", choice["outcome"]);

        console.debug(choice["outcome"] === 'dismissed'
            ? '[Install] User cancelled home-screen install'
            : '[Install] User added to home screen')
      });
    });
  });

  function register(serviceWorkerUrl) {

    const handleServiceWorkerActive = () => {
      navigator.serviceWorker.startMessages();
    }

    const handleRegistrationFailed = (error) => {
      console.error('[ServiceWorker] Registration Failed:', error)
    };

    const handleRegistrationSuccess = (registration) => {
      console.debug('[ServiceWorker] Registration: Succeeded', "Scope:", registration.scope);

      // the installing worker, or undefined
      registration.installing;
      // the waiting worker, or undefined
      registration.waiting;

      // the active worker, or undefined
      console.debug("[ServiceWorker] Active Worker", registration.active);

      registration.addEventListener('updatefound', (event) => {
        console.debug('[ServiceWorker] Update Found', event);

        // wild service worker has appeared in reg.installing
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        // "installing" - the install event has fired, but not yet complete
        // "installed"  - install complete
        // "activating" - the activate event has fired, but not yet completed
        // "activated"  - fully active
        // "redundant"  - discarded. Either failed install, or it's been
        //                replaced by a newer version

        installingWorker.addEventListener('statechange', (event) => {

          // newWorker.state has changed
          console.debug('[ServiceWorker] State Change', event)

          if (installingWorker.state === 'installed') {

            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.debug(
                  'New content is available and will be used when all tabs for this page are closed. ' +
                  'See https://cra.link/PWA.'
              );
            }
          } else {
            // At this point, everything has been precached.
            // It's the perfect time to display a "Content is cached for
            // offline use." message.
            console.debug('Content is cached for offline use.');
          }
        });
      });
    }

    navigator.serviceWorker
        .register(serviceWorkerUrl)
        .then(handleRegistrationSuccess)
        .then(handleServiceWorkerActive)
        .catch(handleRegistrationFailed);
  }

  // noinspection JSUnusedGlobalSymbols
  function unregister() {
    navigator.serviceWorker.ready
        .then(registration => {
          registration.unregister()
              .then(console.debug)
              .catch(console.error);
        })
        .catch(console.error);
  }

  function checkValidServiceWorker(serviceWorkerUrl) {
    // Check if the service worker can be found. If it can't reload the page.
    fetch(serviceWorkerUrl, {headers: {'Service-Worker': 'script'}}).then(response => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1)) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        register(serviceWorkerUrl);
      }
    }).catch(() => {
      console.warn('No internet connection found. App is running in offline mode.');
    });
  }
} else {
  console.warn('This browser does not support service workers')
}
