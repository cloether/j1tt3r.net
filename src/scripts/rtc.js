// NOTE: window.RTCPeerConnection is "not a constructor" in FF22/23
// noinspection JSUnresolvedVariable
const RTCPeerConnection = (
    window.RTCPeerConnection
    || window.webkitRTCPeerConnection
    || window.mozRTCPeerConnection
)

const obj = Object.create(null);

if (RTCPeerConnection) {
  console.debug("[RTC] PeerConnection: Available")

  const configuration = {
    'iceServers': [
      {
        'urls': 'stun:stun.l.google.com:19302'
      }
    ]
  };

  (() => {
    const rtc = new RTCPeerConnection(configuration);

    // noinspection JSUnresolvedVariable
    if (1 || window.mozRTCPeerConnection) {
      // fireFox and now Chrome need a channel/stream to proceed
      // noinspection JSCheckFunctionSignatures
      rtc.createDataChannel('', {reliable: false});
    }

    rtc.onicecandidate = (evt) => {
      if (evt.candidate) {
        // convert candidate to SDP, so we can run it
        // through general parser
        grepSDP(`a=${evt.candidate.candidate}`);
      }
    };

    // noinspection JSIgnoredPromiseFromCall
    rtc.createOffer((offerDesc) => {
      grepSDP(offerDesc.sdp);
      // noinspection JSIgnoredPromiseFromCall
      rtc.setLocalDescription(offerDesc);
    }, (e) => {
      console.warn(`[IP] Offer Failed: ${e}`)
    });

    obj["0.0.0.0"] = false;

    // noinspection NestedFunctionJS
    let updateDisplay = (newAddress) => {
      if (newAddress in obj) {
        return;
      }
      obj[newAddress] = true;
      // const displayAddrs = Object.keys(obj).filter((k) => obj[k]);
    }

    // noinspection NestedFunctionJS
    let grepSDP = (sdp) => {
      // const hosts = [];
      sdp.split('\r\n').forEach(function (line) {
        // References:
        //  http://tools.ietf.org/html/rfc4566#page-39
        let parts, addr;

        if (~line.indexOf("a=candidate")) {
          // http://tools.ietf.org/html/rfc4566#section-5.13
          parts = line.split(' ');
          addr = parts[4];
          let type = parts[7];
          if (type === 'host') {
            updateDisplay(addr);
          }
        } else if (~line.indexOf("c=")) {
          // http://tools.ietf.org/html/rfc4566#section-5.7
          parts = line.split(' ');
          addr = parts[2];
          updateDisplay(addr);
        }
      });
    }
  })();
} else {
  console.warn("[RTC] PeerConnection: unavailable")
}
