/* Email delivery visualizer: submission, DNS MX lookup, SMTP dialogue, mailbox access. */
(function () {
  'use strict';
  var CN = window.CN;

  function build(c) {
    var lanes = [{ name: 'Alice\'s agent', sub: c.agent === 'web' ? 'browser' : 'mail app' }, { name: 'Gmail server', sub: 'smtp.gmail.com' }, { name: 'DNS', sub: 'resolver' }, { name: 'Yahoo server', sub: 'mx.yahoo.com' }, { name: 'Bob\'s agent', sub: c.access === 'web' ? 'browser' : (c.access === 'pop' ? 'POP3 client' : 'IMAP client') }];
    var msgs = [], notes = [], steps = [], t = 0;
    function m(a, b, label, kind, lost) { msgs.push({ from: a, to: b, t0: t, t1: t + 1, label: label, kind: kind || 'data', lost: !!lost }); t += 1; }
    function quick(a, b, label, kind) { msgs.push({ from: a, to: b, t0: t, t1: t + 0.55, label: label, kind: kind || 'data' }); t += 0.55; }
    function step(title, text) { steps.push({ t: t, title: title, text: text }); }

    if (c.agent === 'web') {
      m(0, 1, 'HTTPS POST (compose form)', 'data');
      step('Alice submits the message over HTTP', 'With webmail, Alice\'s user agent is a browser: it sends the message to Gmail\'s server with an HTTP(S) POST. Mail servers still use SMTP between themselves.');
    } else {
      m(0, 1, 'SMTP submission (port 587)', 'data');
      step('Alice\'s mail app pushes the message with SMTP', 'A mail app submits outgoing mail to Alice\'s own mail server with SMTP (TCP, port 587 or 25). The message joins the server\'s outgoing message queue.');
    }
    notes.push({ lane: 1, t: t, text: 'queued for yahoo.com', cls: 'info' });
    m(1, 2, 'DNS query: MX yahoo.com', 'data');
    m(2, 1, 'MX → mx.yahoo.com (+ A)', 'ack');
    step('DNS MX lookup for yahoo.com', 'Gmail\'s server asks DNS for the MX record of the recipient\'s domain to find the mail server that accepts mail for yahoo.com, and its IP address.');
    if (c.down) {
      m(1, 3, 'TCP SYN → port 25', 'ctrl', true);
      notes.push({ lane: 1, t: t, text: 'no answer: retry later', cls: 'warn' });
      step('Bob\'s server is unreachable', 'The connection attempt fails. The message stays in Gmail\'s queue; SMTP servers retry (typically every 30 minutes) and give up only after several days, then tell Alice.');
      t += 0.6;
      notes.push({ lane: 1, t: t, text: '…30 minutes later', cls: 'info' });
    }
    m(1, 3, 'TCP SYN → port 25', 'ctrl'); m(3, 1, 'SYNACK', 'ctrl'); m(1, 3, 'ACK', 'ctrl');
    step('TCP connection from Gmail\'s server to Yahoo\'s, port 25', 'SMTP runs over TCP. The sending server (the SMTP client) opens a connection directly to the receiving server; no intermediate mail servers are used.');
    var dialog = [[3, 1, '220 mx.yahoo.com ready', 'ack'], [1, 3, 'HELO gmail.com'], [3, 1, '250 Hello gmail.com', 'ack'], [1, 3, 'MAIL FROM:<alice@gmail.com>'], [3, 1, '250 Sender ok', 'ack'], [1, 3, 'RCPT TO:<bob@yahoo.com>'], [3, 1, '250 Recipient ok', 'ack'], [1, 3, 'DATA'], [3, 1, '354 End data with .', 'ack'], [1, 3, 'From:, To:, Subject:, body, "."'], [3, 1, '250 Message accepted', 'ack'], [1, 3, 'QUIT'], [3, 1, '221 closing', 'ack']];
    var phaseTitles = { 1: 'Handshaking: greeting and HELO', 5: 'Sender and recipient (MAIL FROM, RCPT TO)', 9: 'Transfer: DATA, message, final “.”', 12: 'Closure: QUIT' };
    var phaseText = {
      1: 'The server greets with reply code 220; the client identifies itself with HELO and the server answers 250.',
      5: 'The client gives the envelope sender and recipient. These SMTP commands are separate from the From: and To: header lines inside the message.',
      9: 'After DATA and reply 354, the client sends the message (header lines, a blank line, the body in 7-bit ASCII; MIME-encoded attachments) ending with a line containing only a full stop. 250 means accepted.',
      12: 'QUIT and 221 end the session. Had Gmail held more mail for Yahoo, it would have reused the same persistent connection.'
    };
    dialog.forEach(function (d, k) {
      quick(d[0], d[1], d[2], d[3] || 'data');
      if (phaseTitles[k]) step(phaseTitles[k], phaseText[k]);
    });
    notes.push({ lane: 3, t: t, text: 'stored in Bob\'s mailbox', cls: 'good' });
    step('The message waits in Bob\'s mailbox', 'SMTP is a push protocol: its job ends here. Bob must pull the message with a mail-access protocol.');
    t += 0.6;
    if (c.access === 'imap') {
      m(4, 3, 'IMAP (143): LOGIN, SELECT INBOX', 'data'); m(3, 4, 'OK, 1 new message', 'ack');
      m(4, 3, 'FETCH 1 (headers)', 'data'); m(3, 4, 'headers', 'ack');
      m(4, 3, 'FETCH 1 (body)', 'data'); m(3, 4, 'message body', 'ack');
      step('Bob reads the message with IMAP', 'IMAP keeps mail on the server: Bob can fetch just the headers first, organise folders on the server, and see the same mailbox from every device.');
    } else if (c.access === 'pop') {
      m(4, 3, 'POP3 (110): user bob / pass ****', 'data'); m(3, 4, '+OK', 'ack');
      step('POP3 authorisation phase', 'POP3 has three phases: authorisation, transaction and update.');
      m(4, 3, 'list', 'data'); m(3, 4, '1 498', 'ack'); m(4, 3, 'retr 1', 'data'); m(3, 4, 'message', 'ack'); m(4, 3, 'dele 1', 'data'); m(3, 4, '+OK', 'ack');
      step('POP3 transaction phase (download-and-delete)', 'Bob\'s agent lists, retrieves and marks the message for deletion. In download-and-keep mode it would skip dele.');
      m(4, 3, 'quit', 'data'); m(3, 4, '+OK (message deleted)', 'ack');
      step('POP3 update phase', 'After quit, the server deletes the marked messages. The mail now lives only on Bob\'s device.');
    } else {
      m(4, 3, 'HTTPS GET /inbox', 'data'); m(3, 4, 'inbox page', 'ack'); m(4, 3, 'HTTPS GET /message/1', 'data'); m(3, 4, 'message', 'ack');
      step('Bob reads it in a browser over HTTP', 'With webmail the browser talks HTTP to Yahoo\'s web front end, which reads the mailbox for him.');
    }
    return { lanes: lanes, msgs: msgs, notes: notes, steps: steps };
  }

  var tl = new CN.Timeline(CN.$('#stage'), { width: 900, unitPx: 44, margin: 80 });
  var player = new CN.Player({ steps: [], unitMs: 700, render: function (T) { tl.draw(T); }, onStep: paint });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);
  function paint() {
    CN.$('#state').innerHTML = '<div class="tw"><table><thead><tr><th>Hop</th><th>Protocol</th><th>Port</th></tr></thead><tbody>' +
      '<tr><td>Alice → Gmail server</td><td>' + (CN.$('#agent').value === 'web' ? 'HTTP(S)' : 'SMTP (push)') + '</td><td>' + (CN.$('#agent').value === 'web' ? '443' : '587 / 25') + '</td></tr>' +
      '<tr><td>Gmail → Yahoo server</td><td>SMTP (push), after DNS MX</td><td>25</td></tr>' +
      '<tr><td>Yahoo server → Bob</td><td>' + ({ imap: 'IMAP (pull)', pop: 'POP3 (pull)', web: 'HTTP(S)' })[CN.$('#access').value] + '</td><td>' + ({ imap: '143', pop: '110', web: '443' })[CN.$('#access').value] + '</td></tr></tbody></table></div>';
  }
  function run() {
    var r = build({ agent: CN.$('#agent').value, access: CN.$('#access').value, down: CN.$('#down').checked });
    tl.setModel({ lanes: r.lanes, msgs: r.msgs, notes: r.notes, timers: [] });
    player.load(r.steps);
  }
  ['#agent', '#access', '#down'].forEach(function (s) { CN.$(s).addEventListener('change', run); });
  CN.$('#apply').addEventListener('click', run);
  run();
})();
