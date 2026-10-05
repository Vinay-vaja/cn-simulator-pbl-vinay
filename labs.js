/**
 * PBL-8 Web Performance Engine - Labs & HTTP Inspector Module
 * Provides deep-dive technical calculation tools, header workbench, and cluster visualizer
 */

class PerformanceLabs {
  constructor() {
    this.initPillar1Calculator();
    this.initPillar2CacheWorkbench();
    this.initPillar3ClusterVisualizer();
    this.initHttpInspector();
  }

  /**
   * Pillar 1: Persistent HTTP RTT & Handshake Overhead Calculator
   */
  initPillar1Calculator() {
    const assetSlider = document.getElementById('calcAssetSlider');
    const rttSlider = document.getElementById('calcRttSlider');
    const assetLabel = document.getElementById('calcAssetCountLabel');
    const rttLabel = document.getElementById('calcRttLabel');
    
    const resHttp10 = document.getElementById('calcHttp10Res');
    const resHttp11 = document.getElementById('calcHttp11Res');
    const resHttp2 = document.getElementById('calcHttp2Res');

    const updateCalc = () => {
      if (!assetSlider || !rttSlider) return;
      const N = parseInt(assetSlider.value);
      const rtt = parseInt(rttSlider.value);

      if (assetLabel) assetLabel.innerText = N;
      if (rttLabel) rttLabel.innerText = `${rtt} ms`;

      // Formulas:
      // HTTP/1.0: N * (2 * RTT for TCP 3-way handshake + HTTP GET)
      const http10Delay = N * (2 * rtt);
      
      // HTTP/1.1 with Keep-Alive: 6 concurrent connections, pipelining queues
      const batches = Math.ceil(N / 6);
      const http11Delay = (6 * rtt) + (batches * rtt);

      // HTTP/2: 1 single TCP connection + 0-RTT/1-RTT parallel stream dispatch
      const http2Delay = (1 * rtt) + Math.round(rtt * 0.4);

      if (resHttp10) resHttp10.innerText = `${http10Delay.toLocaleString()} ms`;
      if (resHttp11) resHttp11.innerText = `${http11Delay.toLocaleString()} ms`;
      if (resHttp2) resHttp2.innerText = `${http2Delay.toLocaleString()} ms`;
    };

    if (assetSlider && rttSlider) {
      assetSlider.addEventListener('input', updateCalc);
      rttSlider.addEventListener('input', updateCalc);
      updateCalc();
    }
  }

  /**
   * Pillar 2: Interactive Cache-Control Header Workbench
   */
  initPillar2CacheWorkbench() {
    const btnTest = document.getElementById('btnTestCacheRequest');
    const selectAsset = document.getElementById('cacheAssetSelect');
    const previewContainer = document.getElementById('cacheResponsePreview');

    let requestCount = 0;

    if (btnTest && selectAsset && previewContainer) {
      btnTest.addEventListener('click', () => {
        requestCount++;
        const asset = selectAsset.value;
        const isSecondOrLater = requestCount > 1;

        if (asset === 'logo') {
          if (isSecondOrLater) {
            previewContainer.innerHTML = `
              <div class="res-status-tag tag-304"><i class="fa-solid fa-circle-check"></i> HTTP/1.1 304 Not Modified (Edge Cache Hit)</div>
              <pre class="header-code"><code>Date: Mon, 05 Oct 2026 22:25:04 GMT
Server: Cloudflare-Edge/2.1
Cache-Control: public, max-age=31536000, immutable
ETag: W/"5829-65a8e"
CF-Cache-Status: HIT (Age: 382s)
X-Response-Time: 1.2ms
Content-Length: 0 [Payload served directly from browser disk/RAM cache]</code></pre>
            `;
          } else {
            previewContainer.innerHTML = `
              <div class="res-status-tag tag-200"><i class="fa-solid fa-server"></i> HTTP/1.1 200 OK (Origin Cache Miss & Populate)</div>
              <pre class="header-code"><code>Date: Mon, 05 Oct 2026 22:25:00 GMT
Server: Apex-Nginx/1.24.0
Content-Type: image/webp
Content-Length: 2457600
Cache-Control: public, max-age=31536000, immutable
ETag: W/"5829-65a8e"
CF-Cache-Status: MISS (Cached at Edge for next requests)
X-Response-Time: 142ms</code></pre>
            `;
          }
        } else if (asset === 'bundle') {
          previewContainer.innerHTML = `
            <div class="res-status-tag tag-200"><i class="fa-solid fa-file-zipper"></i> HTTP/2 200 OK (Brotli Compressed)</div>
            <pre class="header-code"><code>Date: Mon, 05 Oct 2026 22:25:10 GMT
Server: Apex-Nginx/1.24.0
Content-Type: application/javascript; charset=UTF-8
Content-Encoding: br
Content-Length: 428190 (Original: 2.45 MB)
Cache-Control: public, max-age=86400, stale-while-revalidate=3600
ETag: "9831f-br"
Vary: Accept-Encoding</code></pre>
          `;
        } else {
          // Dynamic API
          previewContainer.innerHTML = `
            <div class="res-status-tag tag-200"><i class="fa-solid fa-database"></i> HTTP/2 200 OK (Dynamic Origin Query)</div>
            <pre class="header-code"><code>Date: Mon, 05 Oct 2026 22:25:15 GMT
Server: Apex-Admission-Microservice
Content-Type: application/json; charset=UTF-8
Cache-Control: private, no-cache, no-store, must-revalidate
Set-Cookie: app_token=eyJhbGciOiJIUzI1...; HttpOnly; Secure; SameSite=Strict
Content-Length: 342
X-DB-Query-Time: 12.4ms</code></pre>
          `;
        }
      });
    }
  }

  /**
   * Pillar 3: Server Cluster & Load Balancing Visualizer
   */
  initPillar3ClusterVisualizer() {
    const grid = document.getElementById('serverNodeStatusGrid');
    const algoSelect = document.getElementById('lbAlgoSelect');

    const renderNodes = () => {
      if (!grid) return;
      const numNodes = window.simEngine ? window.simEngine.state.serverNodes : 4;
      const algo = algoSelect ? algoSelect.value : 'round_robin';
      
      let html = '';
      for (let i = 1; i <= numNodes; i++) {
        const cpu = Math.max(8, Math.round(15 + Math.sin(i * 1.5) * 6));
        const rps = Math.round((window.simEngine.state.students / numNodes) * 0.4);
        html += `
          <div class="server-node-box healthy">
            <h6><i class="fa-solid fa-server"></i> Origin Node #${i}</h6>
            <span>CPU: ${cpu}% | RPS: ${rps}</span>
          </div>
        `;
      }
      grid.innerHTML = html;
    };

    if (algoSelect) {
      algoSelect.addEventListener('change', renderNodes);
    }
    renderNodes();
  }

  /**
   * Raw HTTP Packet Inspector Workbench
   */
  initHttpInspector() {
    const buttons = document.querySelectorAll('.scenario-btn');
    const reqBox = document.getElementById('inspectorRequestPacket');
    const resBox = document.getElementById('inspectorResponsePacket');
    const title = document.getElementById('inspectorTitle');
    const badge = document.getElementById('inspectorBadge');
    const explBox = document.getElementById('inspectorExplanation');

    const scenarios = {
      non_persistent_get: {
        title: "HTTP/1.0 Non-Persistent Request (Legacy Bottleneck)",
        badge: "HTTP/1.0 Close",
        req: `GET /admission-portal HTTP/1.0
Host: admission.college.edu
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: text/html,application/xhtml+xml
Connection: close
Cookie: session_id=8f3b29a1c; tracking_id=99281; applicant_temp=true; form_backup=xyz... [4,120 bytes]`,
        res: `HTTP/1.0 200 OK
Date: Mon, 05 Oct 2026 22:30:15 GMT
Server: Apache/2.4.41 (Unix)
Content-Type: text/html; charset=UTF-8
Content-Length: 142850
Connection: close
X-Powered-By: PHP/7.4.3

<!-- Full Uncompressed HTML with inline styles -->
[Socket closed immediately after transmission]`,
        expl: `<strong>Technical Analysis:</strong> Notice <code>Connection: close</code>. The TCP socket is destroyed as soon as the HTML is delivered. The browser is forced to open another brand-new TCP socket with a new 3-way handshake for every subsequent CSS, image, and JavaScript resource (42 handshakes total)!`
      },

      persistent_http2: {
        title: "HTTP/2 Binary Multiplexed Stream (PBL-8 Recommendation)",
        badge: "HTTP/2 Multiplex",
        req: `:method: GET
:scheme: https
:authority: admission.college.edu
:path: /admission-portal
accept: text/html,application/xhtml+xml
accept-encoding: gzip, deflate, br
user-agent: Mozilla/5.0
cookie: auth_jwt=eyJhbGciOiJIUzI1... [180 bytes]
[Stream ID: 1, Priority: High]`,
        res: `:status: 200
date: Mon, 05 Oct 2026 22:30:20 GMT
server: Apex-Nginx/1.24.0
content-type: text/html; charset=UTF-8
content-encoding: br
content-length: 18420
cache-control: no-cache
[Stream ID: 1 - TCP Socket stays open for Streams 3, 5, 7, 9 in parallel]`,
        expl: `<strong>Technical Analysis:</strong> HTTP/2 uses binary framing and stream multiplexing over a single persistent TCP socket. Headers are compressed via HPACK. All 42 page assets download simultaneously without Head-of-Line blocking or multiple handshakes!`
      },

      cache_304: {
        title: "Conditional HTTP GET with ETag / If-None-Match (304 Not Modified)",
        badge: "Web Caching (304)",
        req: `GET /assets/banner.webp HTTP/1.1
Host: static.college-cdn.com
If-None-Match: "64f9b-192a"
If-Modified-Since: Sun, 04 Oct 2026 12:00:00 GMT
Accept: image/avif,image/webp,*/*`,
        res: `HTTP/1.1 304 Not Modified
Date: Mon, 05 Oct 2026 22:30:22 GMT
Server: Cloudflare
ETag: "64f9b-192a"
Cache-Control: public, max-age=31536000, immutable
CF-Cache-Status: HIT

[0 bytes payload transferred over wire - Instant Browser Render!]`,
        expl: `<strong>Technical Analysis:</strong> The client presents <code>If-None-Match: "64f9b-192a"</code>. The server/CDN validates that the file has not changed and sends back a tiny 50-byte <code>304 Not Modified</code> header with 0 payload bytes. This eliminates 2.4 MB of bandwidth transfer!`
      },

      cookie_optimized: {
        title: "Secure Session State Management with Lightweight JWT",
        badge: "Cookie Security",
        req: `POST /api/v1/auth/login HTTP/2
Host: admission.college.edu
Content-Type: application/json

{"application_no": "2026-9481", "dob": "2005-04-12"}`,
        res: `:status: 200
Set-Cookie: auth_token=eyJhbGci...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
Content-Type: application/json

{"status": "authenticated", "student_name": "Applicant #9481"}`,
        expl: `<strong>Technical Analysis:</strong> <code>HttpOnly</code> prevents JavaScript access to defeat Cross-Site Scripting (XSS). <code>Secure</code> ensures transmission only over TLS. <code>SameSite=Strict</code> stops Cross-Site Request Forgery (CSRF). Static assets are kept on a separate cookie-free domain to avoid header bloat.`
      },

      brotli_compressed: {
        title: "Brotli (br) Content Encoding Compression",
        badge: "Efficient Comm",
        req: `GET /dist/app.min.js HTTP/2
Host: static.college-cdn.com
Accept-Encoding: gzip, deflate, br, zstd`,
        res: `:status: 200
content-type: application/javascript; charset=UTF-8
content-encoding: br
content-length: 428190
vary: Accept-Encoding
cache-control: public, max-age=31536000, immutable

[Brotli compressed stream: 428 KB vs 2,450 KB uncompressed raw JavaScript]`,
        expl: `<strong>Technical Analysis:</strong> Brotli provides up to 82% compression for JavaScript bundles compared to raw code, drastically reducing network transmission time for mobile applicants on cellular connections.`
      }
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const key = btn.getAttribute('data-scenario');
        const data = scenarios[key];
        if (data) {
          if (title) title.innerHTML = `<i class="fa-solid fa-terminal"></i> ${data.title}`;
          if (badge) badge.innerText = data.badge;
          if (reqBox) reqBox.innerHTML = `<code>${this.escapeHtml(data.req)}</code>`;
          if (resBox) resBox.innerHTML = `<code>${this.escapeHtml(data.res)}</code>`;
          if (explBox) explBox.innerHTML = `<div class="alert-info">${data.expl}</div>`;
        }
      });
    });
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

window.perfLabs = new PerformanceLabs();
