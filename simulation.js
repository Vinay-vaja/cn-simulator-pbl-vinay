/**
 * PBL-8 Web Performance Engine - Simulation Module (Pitch Black & Gold Edition)
 * Simulates network packet flow, TCP handshakes, latency formulas, and server load
 */

class PerformanceSimulator {
  constructor() {
    this.canvas = document.getElementById('networkCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.packets = [];
    this.animationId = null;
    this.lastFrameTime = performance.now();

    // Default simulation state parameters
    this.state = {
      students: 15000,
      rtt: 80, // ms
      httpVersion: 'http11_keepalive', // 'http10', 'http11_close', 'http11_keepalive', 'http2', 'http3'
      cachingEnabled: true,
      browserCache: true,
      cdnCache: true,
      cacheHitRate: 85, // %
      proxyEnabled: true,
      serverNodes: 4,
      sslOffload: true,
      cookieMode: 'optimized', // 'bloated', 'standard', 'optimized'
      compression: 'brotli', // 'none', 'gzip', 'brotli'
      minify: true,
      
      // Output Metrics
      pageLoadTime: 420,
      serverCpu: 18,
      bandwidthPerUser: 1.4, // MB
      totalBandwidthGbps: 0.168,
      tcpHandshakes: 1,
      errorRate: 0.0,
      statusMessage: "System steady state: HTTP/2 multiplexing active. 85% static assets served from edge cache."
    };

    // Asset Profile (Total 42 assets typical of college admission registration portal)
    this.assetProfile = [
      { name: 'index.html', type: 'HTML', rawSize: 140, isDynamic: true },
      { name: 'app-form.bundle.js', type: 'JS', rawSize: 2450, isDynamic: false },
      { name: 'react-dom.min.js', type: 'JS', rawSize: 130, isDynamic: false },
      { name: 'portal-theme.css', type: 'CSS', rawSize: 480, isDynamic: false },
      { name: 'fa-icons.woff2', type: 'Font', rawSize: 110, isDynamic: false },
      { name: 'campus-aerial.jpg', type: 'Image', rawSize: 3200, isDynamic: false },
      { name: 'university-seal.png', type: 'Image', rawSize: 850, isDynamic: false },
      { name: 'admission-guide.pdf', type: 'Doc', rawSize: 4500, isDynamic: false },
      { name: '/api/v1/quota-seats', type: 'API', rawSize: 180, isDynamic: true },
      { name: '/api/v1/merit-rank', type: 'API', rawSize: 340, isDynamic: true },
      { name: 'step-verification.js', type: 'JS', rawSize: 620, isDynamic: false },
      { name: 'payment-gateway.js', type: 'JS', rawSize: 950, isDynamic: false }
    ];

    this.initCanvas();
    this.startAnimationLoop();
  }

  initCanvas() {
    if (!this.canvas) return;
    const resizeCanvas = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  /**
   * Recalculates all system metrics based on current input parameters
   */
  calculateMetrics() {
    const s = this.state;
    const baseAssetsCount = 42;
    
    // 1. Compression Factor
    let compressionRatio = 1.0;
    if (s.compression === 'gzip') compressionRatio = 0.32; // 68% savings
    if (s.compression === 'brotli') compressionRatio = 0.18; // 82% savings
    if (s.minify) compressionRatio *= 0.85;

    // 2. Cookie Overhead
    let cookieBytesPerRequest = 0;
    if (s.cookieMode === 'bloated') cookieBytesPerRequest = 4200; // 4.2 KB
    else if (s.cookieMode === 'standard') cookieBytesPerRequest = 1024; // 1 KB
    else cookieBytesPerRequest = 200; // 200B lightweight token only on dynamic APIs

    const totalCookieBytes = (s.cookieMode === 'optimized') 
      ? 5 * cookieBytesPerRequest
      : baseAssetsCount * cookieBytesPerRequest;

    // 3. Raw vs Compressed Payload Size (MB)
    const baseRawBytes = 14.8 * 1024 * 1024;
    const staticPayload = baseRawBytes * compressionRatio;
    const totalPayloadBytes = staticPayload + totalCookieBytes;
    s.bandwidthPerUser = Math.max(0.2, (totalPayloadBytes / (1024 * 1024))).toFixed(2);

    // 4. TCP Handshakes & Connection Latency
    let tcpSockets = 1;
    let handshakeRttMultiplier = 1;

    if (s.httpVersion === 'http10') {
      tcpSockets = baseAssetsCount;
      handshakeRttMultiplier = baseAssetsCount * 2.2;
    } else if (s.httpVersion === 'http11_close') {
      tcpSockets = baseAssetsCount;
      handshakeRttMultiplier = baseAssetsCount * 2.0;
    } else if (s.httpVersion === 'http11_keepalive') {
      tcpSockets = 6;
      handshakeRttMultiplier = 6 * 1.5;
    } else if (s.httpVersion === 'http2') {
      tcpSockets = 1;
      handshakeRttMultiplier = 1.2;
    } else if (s.httpVersion === 'http3') {
      tcpSockets = 1;
      handshakeRttMultiplier = 0.8;
    }
    s.tcpHandshakes = tcpSockets;

    // 5. Caching & Origin Offloading
    let effectiveCacheHitRate = 0;
    if (s.cachingEnabled) {
      effectiveCacheHitRate = s.cacheHitRate;
      if (!s.browserCache) effectiveCacheHitRate *= 0.6;
      if (!s.cdnCache) effectiveCacheHitRate *= 0.5;
    }
    const originTrafficRatio = (100 - effectiveCacheHitRate) / 100;

    // 6. Server CPU Utilization & Concurrency Stress
    const numServers = s.proxyEnabled ? parseInt(s.serverNodes) : 1;
    let baseCpuPerStudent = 0.0065;
    if (!s.sslOffload) baseCpuPerStudent *= 1.8;
    if (s.httpVersion === 'http10') baseCpuPerStudent *= 2.5;
    
    const rawCpu = (s.students * baseCpuPerStudent * originTrafficRatio) / numServers;
    s.serverCpu = Math.min(100, Math.round(Math.max(5, rawCpu)));

    // 7. Error Rate & Server Saturation
    if (s.serverCpu > 90) {
      s.errorRate = Math.min(85, ((s.serverCpu - 90) * 8.5)).toFixed(1);
    } else {
      s.errorRate = "0.0";
    }

    // 8. Page Load Time (PLT in milliseconds)
    const transmissionLatency = (parseFloat(s.bandwidthPerUser) * 8 * 1024) / 50;
    const rttLatency = handshakeRttMultiplier * s.rtt;
    const serverProcessingTime = (s.serverCpu > 80) ? (s.serverCpu * 35) : 80;
    
    let totalPlt = (rttLatency + transmissionLatency + (originTrafficRatio * serverProcessingTime));
    
    if (s.httpVersion === 'http2' || s.httpVersion === 'http3') {
      totalPlt = totalPlt * 0.45;
    }

    if (effectiveCacheHitRate > 75) {
      totalPlt = totalPlt * (1 - (effectiveCacheHitRate * 0.007));
    }

    s.pageLoadTime = Math.max(180, Math.round(totalPlt));

    // Dynamic Log Status
    if (s.serverCpu >= 95) {
      s.statusMessage = `CRITICAL ALERT: Origin servers at ${s.serverCpu}% CPU! ${s.errorRate}% of student requests timing out (504 Gateway Timeout).`;
    } else if (s.httpVersion === 'http10') {
      s.statusMessage = `Bottleneck: Non-persistent HTTP/1.0 generating ${s.tcpHandshakes} TCP handshakes per student.`;
    } else if (s.cachingEnabled && effectiveCacheHitRate > 80) {
      s.statusMessage = `Optimal: ${effectiveCacheHitRate}% of admission traffic absorbed by CDN Edge Cache. Origin load is only ${s.serverCpu}%.`;
    } else {
      s.statusMessage = `Traffic steady: ${s.students.toLocaleString()} students active. Avg load time: ${s.pageLoadTime}ms.`;
    }

    this.updateUI();
  }

  /**
   * Updates all UI widgets and indicators
   */
  updateUI() {
    const s = this.state;

    // DOM Elements
    const elPageLoad = document.getElementById('valPageLoad');
    const elServerCpu = document.getElementById('valServerCpu');
    const elBarServerCpu = document.getElementById('barServerCpu');
    const elBandwidth = document.getElementById('valBandwidth');
    const elTcpHandshakes = document.getElementById('valTcpHandshakes');
    const elStatusPageLoad = document.getElementById('statusPageLoad');
    const elStatusServerCpu = document.getElementById('statusServerCpu');
    const elCanvasLiveLog = document.getElementById('logMessage');
    const elStudentCountLabel = document.getElementById('studentCountLabel');
    const elRttLabel = document.getElementById('rttLabel');
    const elHttpTag = document.getElementById('httpTag');
    const elCookieTag = document.getElementById('cookieTag');
    const elWaterfallBadge = document.getElementById('waterfallSummaryBadge');

    if (elPageLoad) elPageLoad.innerHTML = `${s.pageLoadTime} <span class="unit">ms</span>`;
    if (elServerCpu) elServerCpu.innerHTML = `${s.serverCpu} <span class="unit">%</span>`;
    if (elBandwidth) elBandwidth.innerHTML = `${s.bandwidthPerUser} <span class="unit">MB/page</span>`;
    if (elTcpHandshakes) elTcpHandshakes.innerHTML = `${s.tcpHandshakes} <span class="unit">sockets</span>`;
    
    if (elStudentCountLabel) elStudentCountLabel.innerText = `${s.students.toLocaleString()} Users`;
    if (elRttLabel) elRttLabel.innerText = `${s.rtt} ms`;
    if (elHttpTag) elHttpTag.innerText = s.httpVersion.toUpperCase();
    if (elCookieTag) elCookieTag.innerText = s.cookieMode;
    if (elCanvasLiveLog) elCanvasLiveLog.innerText = s.statusMessage;

    // Bar CPU Color
    if (elBarServerCpu) {
      elBarServerCpu.style.width = `${s.serverCpu}%`;
      if (s.serverCpu > 85) elBarServerCpu.style.background = '#ff3366';
      else if (s.serverCpu > 55) elBarServerCpu.style.background = '#ffb703';
      else elBarServerCpu.style.background = '#ffbd39';
    }

    // Status classes
    if (elStatusServerCpu) {
      if (s.serverCpu > 85) {
        elStatusServerCpu.className = 'metric-status status-danger';
        elStatusServerCpu.innerHTML = `<i class="fa-solid fa-fire text-danger"></i> Severe Overload (${s.errorRate}% Errors)`;
      } else if (s.serverCpu > 55) {
        elStatusServerCpu.className = 'metric-status status-warning';
        elStatusServerCpu.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-warning"></i> High Load`;
      } else {
        elStatusServerCpu.className = 'metric-status status-good';
        elStatusServerCpu.innerHTML = `<i class="fa-solid fa-circle-check text-warning"></i> Optimal & Scalable`;
      }
    }

    if (elStatusPageLoad) {
      if (s.pageLoadTime > 4000) {
        elStatusPageLoad.className = 'metric-status status-danger';
        elStatusPageLoad.innerHTML = `<i class="fa-solid fa-circle-xmark text-danger"></i> Frustrating (14.6x Slower)`;
      } else if (s.pageLoadTime > 1200) {
        elStatusPageLoad.className = 'metric-status status-warning';
        elStatusPageLoad.innerHTML = `<i class="fa-solid fa-clock text-warning"></i> Moderate Lag`;
      } else {
        elStatusPageLoad.className = 'metric-status status-good';
        elStatusPageLoad.innerHTML = `<i class="fa-solid fa-bolt text-warning"></i> Lightning Fast (${s.pageLoadTime}ms)`;
      }
    }

    // Node Sub-Labels in Canvas
    const elClientSub = document.getElementById('clientNodeSub');
    const elProxySub = document.getElementById('proxyNodeSub');
    const elServerSub = document.getElementById('serverNodeSub');
    if (elClientSub) elClientSub.innerText = `${(s.students/1000).toFixed(1)}k Active`;
    if (elProxySub) elProxySub.innerText = s.cachingEnabled ? `Cache: ${s.cacheHitRate}% Hit` : `Proxy: Bypass`;
    if (elServerSub) elServerSub.innerText = `${s.serverNodes} Node(s) (${s.serverCpu}%)`;

    if (elWaterfallBadge) elWaterfallBadge.innerText = `Total: ${s.pageLoadTime} ms`;

    this.renderWaterfall();
  }

  /**
   * Renders the asset waterfall timeline bars
   */
  renderWaterfall() {
    const container = document.getElementById('waterfallList');
    if (!container) return;

    const s = this.state;
    const isHttp2 = s.httpVersion === 'http2' || s.httpVersion === 'http3';
    let cumulativeDelay = 0;

    const html = this.assetProfile.map((asset, index) => {
      let duration = Math.round((asset.rawSize / 100) * (s.rtt / 40));
      if (s.compression !== 'none' && !asset.isDynamic) duration = Math.max(12, Math.round(duration * 0.3));
      
      let isCached = s.cachingEnabled && !asset.isDynamic && (index % 5 !== 0);
      if (isCached) duration = Math.round(duration * 0.15);

      let offset = isHttp2 ? (index * 4) : cumulativeDelay;
      if (!isHttp2) cumulativeDelay += duration * 0.6;

      const fillClass = isCached ? 'fill-cached' : (
        asset.type === 'HTML' ? 'fill-html' :
        asset.type === 'CSS' ? 'fill-css' :
        asset.type === 'JS' ? 'fill-js' : 'fill-img'
      );

      const maxDuration = Math.max(s.pageLoadTime, 1);
      const widthPercent = Math.min(100, Math.max(5, (duration / maxDuration) * 100));
      const leftPercent = Math.min(90, (offset / maxDuration) * 80);

      return `
        <div class="waterfall-item">
          <span class="w-name" title="${asset.name}">${asset.name}</span>
          <span class="w-type">${isCached ? '304' : asset.type}</span>
          <div class="w-bar-track">
            <div class="w-bar-fill ${fillClass}" style="width: ${widthPercent}%; margin-left: ${leftPercent}%;"></div>
          </div>
          <span class="w-time">${duration}ms</span>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Spawns animated packets across topology nodes
   */
  spawnPacket(sourceIdx, targetIdx, type) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Node X positions
    const nodePositions = [
      { x: w * 0.15, y: h * 0.5 }, // 0: Client
      { x: w * 0.40, y: h * 0.5 }, // 1: Proxy/CDN
      { x: w * 0.65, y: h * 0.5 }, // 2: Server
      { x: w * 0.88, y: h * 0.5 }  // 3: DB
    ];

    const colors = {
      syn: '#ffffff',
      get: '#ffbd39',
      cacheHit: '#ffbd39',
      originReq: '#ffb703',
      resOk: '#00e676',
      resError: '#ff3366'
    };

    this.packets.push({
      startX: nodePositions[sourceIdx].x,
      startY: nodePositions[sourceIdx].y,
      endX: nodePositions[targetIdx].x,
      endY: nodePositions[targetIdx].y,
      progress: 0,
      speed: (1 / (this.state.rtt * 0.8)) * (0.8 + Math.random() * 0.4),
      color: colors[type] || '#ffbd39',
      size: type === 'syn' ? 3.5 : (type === 'cacheHit' ? 5.5 : 4.5),
      type: type
    });
  }

  /**
   * Canvas Animation Loop
   */
  startAnimationLoop() {
    let lastSpawn = 0;

    const animate = (timestamp) => {
      if (!this.ctx || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      this.ctx.clearRect(0, 0, w, h);

      // Draw connection wires between nodes
      const nodeX = [w * 0.15, w * 0.40, w * 0.65, w * 0.88];
      const centerY = h * 0.5;

      this.ctx.beginPath();
      this.ctx.moveTo(nodeX[0], centerY);
      this.ctx.lineTo(nodeX[3], centerY);
      this.ctx.strokeStyle = '#1e1e1e';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Periodically spawn realistic request packets
      if (timestamp - lastSpawn > Math.max(80, 500 - (this.state.students / 100))) {
        lastSpawn = timestamp;
        
        // Step 1: Student -> Proxy (GET Request)
        this.spawnPacket(0, 1, 'get');

        // Step 2: Caching decision
        const isHit = this.state.cachingEnabled && (Math.random() * 100 < this.state.cacheHitRate);
        setTimeout(() => {
          if (isHit) {
            // Edge Cache Hit: Proxy -> Student (304 / 200 Fast)
            this.spawnPacket(1, 0, 'cacheHit');
          } else {
            // Cache Miss: Proxy -> Origin Server
            this.spawnPacket(1, 2, 'originReq');

            setTimeout(() => {
              // Server -> DB if dynamic
              if (Math.random() > 0.4) {
                this.spawnPacket(2, 3, 'originReq');
                setTimeout(() => this.spawnPacket(3, 2, 'resOk'), 80);
              }

              // Server response back to Proxy -> Client
              const isServerOverloaded = this.state.serverCpu > 90 && Math.random() > 0.4;
              setTimeout(() => {
                this.spawnPacket(2, 1, isServerOverloaded ? 'resError' : 'resOk');
                setTimeout(() => {
                  this.spawnPacket(1, 0, isServerOverloaded ? 'resError' : 'resOk');
                }, 70);
              }, 100);

            }, 80);
          }
        }, 90);
      }

      // Update and draw active packets
      for (let i = this.packets.length - 1; i >= 0; i--) {
        const p = this.packets[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          this.packets.splice(i, 1);
          continue;
        }

        const curX = p.startX + (p.endX - p.startX) * p.progress;
        const curY = p.startY + (p.endY - p.startY) * p.progress;

        this.ctx.beginPath();
        this.ctx.arc(curX, curY, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }
}

// Instantiate global simulator
window.simEngine = new PerformanceSimulator();
