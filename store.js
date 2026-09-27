/* Tiny storage layer: Firestore when configured, same-browser demo channel otherwise. */
(function () {
  var cfg = window.RAIN_CONFIG, live = !!(cfg.firebase && cfg.firebase.apiKey);
  var bc = ('BroadcastChannel' in window) ? new BroadcastChannel('wonderlash-rain') : null;
  var col = null;
  if (live) {
    firebase.initializeApp(cfg.firebase);
    col = firebase.firestore().collection('events').doc(cfg.eventId).collection('names');
  }
  window.RainStore = {
    live: live,
    add: function (name) {
      if (live) return col.add({ name: name, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      var list = JSON.parse(localStorage.getItem('rain-demo') || '[]'); list.push(name);
      localStorage.setItem('rain-demo', JSON.stringify(list));
      if (bc) bc.postMessage(name);
      return Promise.resolve();
    },
    // onName(name, isNew): called once for every existing name, then live for new ones
    listen: function (onName) {
      if (live) {
        var first = true;
        col.orderBy('createdAt').onSnapshot(function (snap) {
          snap.docChanges().forEach(function (ch) { if (ch.type === 'added') onName(ch.doc.data().name, !first); });
          first = false;
        });
        return;
      }
      JSON.parse(localStorage.getItem('rain-demo') || '[]').forEach(function (n) { onName(n, false); });
      if (bc) bc.onmessage = function (e) { onName(e.data, true); };
    }
  };
})();
