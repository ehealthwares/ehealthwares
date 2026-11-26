/**
 * In-chat video for the MyAIha web client.
 *
 * A call is a conversation: the room id IS the conversation id, so joining is
 * `call.join { callId: conversationId }` on the engine's `/calls` namespace.
 * Media is peer-to-peer (WebRTC); the engine only relays SDP/ICE.
 *
 * Usage:
 *   MyAIhaCall.open({ conversationId, phone })   // opens the in-chat panel
 *   MyAIhaCall.close()                           // hang up
 *   MyAIhaCall.popOut()                          // move the call to its own window
 *
 * Popping out navigates to `?call=<conversationId>`, which the host page turns
 * back into `open(...)` — so a popped-out window and the chat tab negotiate the
 * same room, and the tab that left stops holding a seat.
 */
(function (global) {
  var CONFIG = Object.assign(
    { SOCKET_BASE: 'http://localhost:8090' },
    (global.MYAIHA_CONFIG || {}),
  );

  var socket = null;
  var pc = null;
  var localStream = null;
  var remoteStream = null;
  var roomId = null;
  var isOfferer = false;
  var panel = null;

  var ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function setStatus(text) {
    var status = panel && panel.querySelector('.mh-call-status');
    if (status) status.textContent = text;
  }

  function buildPanel() {
    if (panel) return panel;
    panel = el('div', 'mh-call');
    panel.innerHTML =
      '<div class="mh-call-head">' +
      '  <span class="mh-call-title">Consultation</span>' +
      '  <span class="mh-call-status">Connecting…</span>' +
      '</div>' +
      '<div class="mh-call-videos">' +
      '  <video class="mh-call-remote" autoplay playsinline></video>' +
      '  <video class="mh-call-local" autoplay playsinline muted></video>' +
      '</div>' +
      '<div class="mh-call-actions">' +
      '  <button type="button" class="mh-call-pop">Pop out</button>' +
      '  <button type="button" class="mh-call-leave">Leave</button>' +
      '</div>';

    panel.querySelector('.mh-call-leave').addEventListener('click', close);
    panel.querySelector('.mh-call-pop').addEventListener('click', popOut);
    document.body.appendChild(panel);
    return panel;
  }

  function startMedia() {
    // No camera/mic must not stop the call from joining: the clinician still
    // needs to know the patient is in the room.
    return navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(function (stream) {
        localStream = stream;
        var local = panel.querySelector('.mh-call-local');
        local.srcObject = stream;
        return stream;
      })
      .catch(function (err) {
        setStatus('Camera/mic unavailable — joined without media');
        console.warn('[myaiha] media unavailable:', err && err.message);
        return null;
      });
  }

  function createPeer() {
    if (pc) return pc;
    pc = new RTCPeerConnection(ICE);

    if (localStream) {
      localStream.getTracks().forEach(function (track) {
        pc.addTrack(track, localStream);
      });
    }

    remoteStream = new MediaStream();
    panel.querySelector('.mh-call-remote').srcObject = remoteStream;

    pc.ontrack = function (event) {
      event.streams[0].getTracks().forEach(function (track) {
        remoteStream.addTrack(track);
      });
      setStatus('Connected');
    };

    pc.onicecandidate = function (event) {
      if (event.candidate && socket) {
        socket.emit('call.ice', {
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          candidate: event.candidate.candidate,
        });
      }
    };

    return pc;
  }

  function offer() {
    createPeer();
    return pc
      .createOffer()
      .then(function (desc) { return pc.setLocalDescription(desc); })
      .then(function () { socket.emit('call.offer', { sdp: pc.localDescription.sdp }); });
  }

  function open(opts) {
    opts = opts || {};
    if (!opts.conversationId) throw new Error('conversationId required');
    if (typeof io === 'undefined') throw new Error('socket.io client not loaded');

    close();
    roomId = opts.conversationId;
    buildPanel();
    setStatus('Connecting…');

    return startMedia().then(function () {
      socket = io(CONFIG.SOCKET_BASE + '/calls', {
        transports: ['websocket'],
        auth: { guest: 'true', phone: opts.phone || '' },
      });

      socket.on('connect', function () {
        socket.emit('call.join', { callId: roomId });
      });

      socket.on('call.joined', function (payload) {
        var peers = (payload && payload.peers) || [];
        // Whoever is already in the room creates the offer; the newcomer waits.
        isOfferer = peers.length === 0;
        setStatus(isOfferer ? 'Waiting for the clinician…' : 'Joining…');
        if (isOfferer) return;
      });

      socket.on('call.peer.joined', function () {
        setStatus('Connected');
        offer();
      });

      socket.on('call.offer', function (payload) {
        createPeer();
        pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp })
          .then(function () { return pc.createAnswer(); })
          .then(function (desc) { return pc.setLocalDescription(desc); })
          .then(function () {
            socket.emit('call.answer', { sdp: pc.localDescription.sdp });
            setStatus('Connected');
          });
      });

      socket.on('call.answer', function (payload) {
        if (pc) pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
      });

      socket.on('call.ice', function (payload) {
        if (!pc || !payload || !payload.candidate) return;
        pc.addIceCandidate({
          sdpMid: payload.sdpMid,
          sdpMLineIndex: payload.sdpMLineIndex,
          candidate: payload.candidate,
        }).catch(function () { /* candidate may arrive before the peer exists */ });
      });

      socket.on('call.peer.left', function () { setStatus('The other side left'); });
      socket.on('call.declined', function () { setStatus('Call declined'); });
      socket.on('call.full', function () { setStatus('This consultation is already full'); });
      socket.on('call.replaced', function () { setStatus('Opened in another window'); });
    });
  }

  function close() {
    if (socket) {
      try { socket.emit('call.leave', {}); } catch (e) { /* ignore */ }
      socket.disconnect();
      socket = null;
    }
    if (pc) { pc.close(); pc = null; }
    if (localStream) {
      localStream.getTracks().forEach(function (t) { t.stop(); });
      localStream = null;
    }
    remoteStream = null;
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
  }

  /**
   * Move the call into its own window. The embedded call hangs up first so the
   * room never holds two seats for one person.
   */
  function popOut() {
    if (!roomId) return;
    var url = new URL(window.location.href);
    url.searchParams.set('call', roomId);
    window.open(url.toString(), 'myaiha-call-' + roomId, 'width=520,height=720');
    close();
  }

  global.MyAIhaCall = { open: open, close: close, popOut: popOut, roomId: function () { return roomId; } };
})(window);
