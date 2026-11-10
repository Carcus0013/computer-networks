/* FTP visualizer: persistent control connection (21), one data connection per transfer. */
(function () {
  'use strict';
  var CN = window.CN;
  function build(c) {
    var lanes = [{ name: 'Client control', sub: 'port 1500' }, { name: 'Client data', sub: c.mode === 'active' ? 'port 1501 (PORT)' : 'ephemeral port' }, { name: 'Server, port 21', sub: 'control' }, { name: 'Server data', sub: c.mode === 'active' ? 'port 20' : 'PASV port 50000' }];
    var msgs = [], notes = [], steps = [], t = 0;
    function m(a, b, label, kind, lost, d) { msgs.push({ from: a, to: b, t0: t, t1: t + (d || 1), label: label, kind: kind || 'data', lost: !!lost }); t += (d || 1); }
    function step(title, text) { steps.push({ t: t, title: title, text: text }); }
    m(0, 2, 'TCP connect → 21', 'ctrl'); m(2, 0, '220 Service ready', 'ack');
    step('Control connection opened (port 21)', 'The client opens a TCP connection to the server\'s port 21. This control connection stays open for the whole session and carries only commands and replies (out-of-band control).');
    m(0, 2, 'USER alice', 'data', false, 0.7); m(2, 0, '331 Password required', 'ack', false, 0.7); m(0, 2, 'PASS ****', 'data', false, 0.7); m(2, 0, '230 Login OK', 'ack', false, 0.7);
    step('Login on the control connection', 'USER and PASS are sent as plain NVT-ASCII text (FTP is not encrypted); each reply starts with a three-digit code: 331 = need password, 230 = logged in. The server now keeps state for this user (login, current directory).');
    var files = [];
    for (var i = 1; i <= c.files; i++) files.push('report' + i + '.pdf');
    var blocked = false;
    files.forEach(function (f, k) {
      if (c.mode === 'active') {
        m(0, 2, 'PORT h1,h2,h3,h4,5,221', 'data', false, 0.7); m(2, 0, '200 PORT OK', 'ack', false, 0.7);
        m(0, 2, 'RETR ' + f, 'data', false, 0.7); m(2, 0, '150 Opening data connection', 'ack', false, 0.7);
        step('Active mode: PORT, then RETR ' + f, 'The client announces the port it will listen on for data (here 1501 = 5 × 256 + 221) and asks to retrieve the file. In active mode the <b>server</b> opens the data connection.');
        if (c.fw) {
          m(3, 1, 'TCP SYN from port 20', 'ctrl', true);
          notes.push({ lane: 1, t: t, text: 'blocked by client firewall', cls: 'bad' });
          m(2, 0, '425 Can\'t open data connection', 'bad', false, 0.8);
          step('The incoming data connection is blocked', 'The client\'s firewall drops the server\'s inbound connection from port 20. Login and commands still work (port 21 is fine) but no file can arrive: exactly the 23CSE302 Mid 2025 Q5 situation. Switching to passive mode fixes it, because the client then opens the data connection outward.');
          blocked = true;
          return;
        }
        m(3, 1, 'TCP SYN from port 20', 'ctrl', false, 0.8); m(1, 3, 'SYNACK', 'ctrl', false, 0.8); m(3, 1, 'ACK', 'ctrl', false, 0.6);
        step('Server opens the data connection (20 → 1501)', 'A brand-new TCP connection, separate from the control connection, is set up for this one transfer.');
      } else {
        m(0, 2, 'PASV', 'data', false, 0.7); m(2, 0, '227 Entering Passive Mode (…,195,80)', 'ack', false, 0.7);
        m(0, 2, 'RETR ' + f, 'data', false, 0.7);
        step('Passive mode: PASV, then RETR ' + f, 'The server replies with a port (195 × 256 + 80 = 50000) and waits; the <b>client</b> opens the data connection to it, which passes outbound through client firewalls and NAT.');
        m(1, 3, 'TCP SYN → 50000', 'ctrl', false, 0.8); m(3, 1, 'SYNACK', 'ctrl', false, 0.8); m(1, 3, 'ACK', 'ctrl', false, 0.6);
        m(2, 0, '150 Opening data connection', 'ack', false, 0.7);
        step('Client opens the data connection', 'A brand-new TCP connection, separate from the control connection, used for this one transfer.');
      }
      m(3, 1, 'file bytes of ' + f, 'data', false, 1.2); m(3, 1, 'FIN (end of file)', 'ctrl', false, 0.8);
      m(2, 0, '226 Transfer complete', 'ack', false, 0.8);
      notes.push({ lane: 1, t: t, text: 'data connection closed', cls: 'info' });
      step('File sent; the data connection closes', 'The server sends the file on the data connection and closes it: closing marks the end of the file. The control connection reports 226. ' + (k < files.length - 1 ? 'The next file will get a fresh data connection.' : ''));
    });
    if (!blocked) {
      m(0, 2, 'QUIT', 'data', false, 0.7); m(2, 0, '221 Goodbye', 'ack', false, 0.7);
      step('QUIT ends the session', 'Only now does the control connection close. One control connection, ' + c.files + ' data connection(s).');
    }
    return { lanes: lanes, msgs: msgs, notes: notes, steps: steps };
  }
  var tl = new CN.Timeline(CN.$('#stage'), { width: 860, unitPx: 46, margin: 100 });
  var player = new CN.Player({ steps: [], unitMs: 650, render: function (T) { tl.draw(T); }, onStep: function () {
    CN.$('#state').innerHTML = '<div class="tw"><table><thead><tr><th>Connection</th><th>Port</th><th>Lifetime</th></tr></thead><tbody><tr><td>Control</td><td>21</td><td>Whole session (persistent)</td></tr><tr><td>Data</td><td>' + (CN.$('#mode').value === 'active' ? '20 → client\'s PORT' : 'client → PASV port') + '</td><td>One per file or listing</td></tr></tbody></table></div>';
  } });
  CN.controls(CN.$('#controls'), player);
  CN.stepPanel(CN.$('#now'), CN.$('#steplist'), player);
  function run() {
    var r = build({ mode: CN.$('#mode').value, files: Math.max(1, Math.min(4, +CN.$('#files').value || 1)), fw: CN.$('#fw').checked });
    tl.setModel({ lanes: r.lanes, msgs: r.msgs, notes: r.notes, timers: [] });
    player.load(r.steps);
  }
  ['#mode', '#fw'].forEach(function (s) { CN.$(s).addEventListener('change', run); });
  CN.$('#apply').addEventListener('click', run);
  run();
})();
