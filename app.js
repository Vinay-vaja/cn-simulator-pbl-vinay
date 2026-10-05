/**
 * PBL-8 Web Performance Engine - Main App Controller (Pitch Black & Gold Edition)
 * Orchestrates navigation, Chart.js graph, controls synchronization, and quick presets
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  initSubTabNavigation();
  initSimulationControls();
  initPresets();
  initLatencyChart();

  // Initial Calculation
  if (window.simEngine) {
    window.simEngine.calculateMetrics();
  }
});

/**
 * Main Top Navigation Tabs
 */
function initTabNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = `tab-${tab.getAttribute('data-tab')}`;

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');

      if (tab.getAttribute('data-tab') === 'simulator' && window.latencyChartInstance) {
        window.latencyChartInstance.resize();
      }
    });
  });
}

/**
 * 5-Pillar Sub-Tab Navigation
 */
function initSubTabNavigation() {
  const subTabs = document.querySelectorAll('.sub-tab');
  const subContents = document.querySelectorAll('.sub-tab-content');

  subTabs.forEach(subTab => {
    subTab.addEventListener('click', () => {
      const targetId = subTab.getAttribute('data-subtab');

      subTabs.forEach(t => t.classList.remove('active'));
      subContents.forEach(c => c.classList.remove('active'));

      subTab.classList.add('active');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

/**
 * Controls Synchronization with Simulator Engine
 */
function initSimulationControls() {
  const sim = window.simEngine;
  if (!sim) return;

  // Sliders
  const studentSlider = document.getElementById('studentSlider');
  const rttSlider = document.getElementById('rttSlider');
  const cacheHitSlider = document.getElementById('cacheHitSlider');
  const cacheHitRateLabel = document.getElementById('cacheHitRateLabel');

  // Selects & Toggles
  const httpSelect = document.getElementById('httpVersionSelect');
  const cacheToggle = document.getElementById('cacheToggle');
  const browserCacheCheck = document.getElementById('browserCacheCheck');
  const cdnCacheCheck = document.getElementById('cdnCacheCheck');
  const proxyToggle = document.getElementById('proxyToggle');
  const serverNodesSelect = document.getElementById('serverNodesSelect');
  const sslOffloadCheck = document.getElementById('sslOffloadCheck');
  const cookieSelect = document.getElementById('cookieOptimizationSelect');
  const compressionSelect = document.getElementById('compressionSelect');
  const minifyCheck = document.getElementById('minifyCheck');

  const btnReset = document.getElementById('btnResetControls');
  const btnRunBurst = document.getElementById('btnRunSim');

  // Event Listeners
  if (studentSlider) {
    studentSlider.addEventListener('input', (e) => {
      sim.state.students = parseInt(e.target.value);
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (rttSlider) {
    rttSlider.addEventListener('input', (e) => {
      sim.state.rtt = parseInt(e.target.value);
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (cacheHitSlider) {
    cacheHitSlider.addEventListener('input', (e) => {
      sim.state.cacheHitRate = parseInt(e.target.value);
      if (cacheHitRateLabel) cacheHitRateLabel.innerText = `${e.target.value}%`;
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (httpSelect) {
    httpSelect.addEventListener('change', (e) => {
      sim.state.httpVersion = e.target.value;
      const hint = document.getElementById('httpHint');
      if (hint) {
        if (e.target.value === 'http10') hint.innerText = "HTTP/1.0: Closes TCP socket after each asset. Multiplies RTT x42.";
        else if (e.target.value.includes('http11')) hint.innerText = "HTTP/1.1: Uses Keep-Alive connection pooling with max 6 domain sockets.";
        else if (e.target.value === 'http2') hint.innerText = "HTTP/2: Multiplexes all assets concurrently across 1 single TCP connection.";
        else hint.innerText = "HTTP/3: Operates over UDP with 0-RTT connection handshake.";
      }
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (cacheToggle) {
    cacheToggle.addEventListener('change', (e) => {
      sim.state.cachingEnabled = e.target.checked;
      const sub = document.getElementById('cacheSubOptions');
      if (sub) sub.style.opacity = e.target.checked ? '1' : '0.4';
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (browserCacheCheck) {
    browserCacheCheck.addEventListener('change', (e) => {
      sim.state.browserCache = e.target.checked;
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (cdnCacheCheck) {
    cdnCacheCheck.addEventListener('change', (e) => {
      sim.state.cdnCache = e.target.checked;
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (proxyToggle) {
    proxyToggle.addEventListener('change', (e) => {
      sim.state.proxyEnabled = e.target.checked;
      const sub = document.getElementById('proxySubOptions');
      if (sub) sub.style.opacity = e.target.checked ? '1' : '0.4';
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (serverNodesSelect) {
    serverNodesSelect.addEventListener('change', (e) => {
      sim.state.serverNodes = parseInt(e.target.value);
      sim.calculateMetrics();
      updateChart();
      if (window.perfLabs) window.perfLabs.initPillar3ClusterVisualizer();
    });
  }

  if (sslOffloadCheck) {
    sslOffloadCheck.addEventListener('change', (e) => {
      sim.state.sslOffload = e.target.checked;
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (cookieSelect) {
    cookieSelect.addEventListener('change', (e) => {
      sim.state.cookieMode = e.target.value;
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (compressionSelect) {
    compressionSelect.addEventListener('change', (e) => {
      sim.state.compression = e.target.value;
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (minifyCheck) {
    minifyCheck.addEventListener('change', (e) => {
      sim.state.minify = e.target.checked;
      sim.calculateMetrics();
      updateChart();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      loadOptimizedPreset();
    });
  }

  if (btnRunBurst) {
    btnRunBurst.addEventListener('click', () => {
      btnRunBurst.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Simulating 10k Surge...';
      const originalStudents = sim.state.students;
      sim.state.students = Math.min(50000, sim.state.students + 10000);
      if (studentSlider) studentSlider.value = sim.state.students;
      sim.calculateMetrics();
      updateChart();

      for (let i = 0; i < 15; i++) {
        setTimeout(() => sim.spawnPacket(0, 1, 'get'), i * 40);
      }

      setTimeout(() => {
        btnRunBurst.innerHTML = '<i class="fa-solid fa-play"></i> Run Stress Test Burst';
      }, 1200);
    });
  }
}

/**
 * Quick Preset Buttons
 */
function initPresets() {
  const btnCrash = document.getElementById('quickPresetUnoptimized');
  const btnOpt = document.getElementById('quickPresetOptimized');

  if (btnCrash) {
    btnCrash.addEventListener('click', () => {
      loadCrashPreset();
    });
  }

  if (btnOpt) {
    btnOpt.addEventListener('click', () => {
      loadOptimizedPreset();
    });
  }
}

function loadCrashPreset() {
  const sim = window.simEngine;
  if (!sim) return;

  sim.state.students = 35000;
  sim.state.rtt = 120;
  sim.state.httpVersion = 'http10';
  sim.state.cachingEnabled = false;
  sim.state.browserCache = false;
  sim.state.cdnCache = false;
  sim.state.cacheHitRate = 10;
  sim.state.proxyEnabled = false;
  sim.state.serverNodes = 1;
  sim.state.sslOffload = false;
  sim.state.cookieMode = 'bloated';
  sim.state.compression = 'none';
  sim.state.minify = false;

  document.getElementById('studentSlider').value = 35000;
  document.getElementById('rttSlider').value = 120;
  document.getElementById('httpVersionSelect').value = 'http10';
  document.getElementById('cacheToggle').checked = false;
  document.getElementById('browserCacheCheck').checked = false;
  document.getElementById('cdnCacheCheck').checked = false;
  document.getElementById('proxyToggle').checked = false;
  document.getElementById('serverNodesSelect').value = "1";
  document.getElementById('sslOffloadCheck').checked = false;
  document.getElementById('cookieOptimizationSelect').value = 'bloated';
  document.getElementById('compressionSelect').value = 'none';
  document.getElementById('minifyCheck').checked = false;

  sim.calculateMetrics();
  updateChart();

  const simTab = document.querySelector('.nav-tab[data-tab="simulator"]');
  if (simTab) simTab.click();
}

function loadOptimizedPreset() {
  const sim = window.simEngine;
  if (!sim) return;

  sim.state.students = 25000;
  sim.state.rtt = 60;
  sim.state.httpVersion = 'http2';
  sim.state.cachingEnabled = true;
  sim.state.browserCache = true;
  sim.state.cdnCache = true;
  sim.state.cacheHitRate = 92;
  sim.state.proxyEnabled = true;
  sim.state.serverNodes = 4;
  sim.state.sslOffload = true;
  sim.state.cookieMode = 'optimized';
  sim.state.compression = 'brotli';
  sim.state.minify = true;

  document.getElementById('studentSlider').value = 25000;
  document.getElementById('rttSlider').value = 60;
  document.getElementById('httpVersionSelect').value = 'http2';
  document.getElementById('cacheToggle').checked = true;
  document.getElementById('browserCacheCheck').checked = true;
  document.getElementById('cdnCacheCheck').checked = true;
  document.getElementById('cacheHitSlider').value = 92;
  document.getElementById('cacheHitRateLabel').innerText = '92%';
  document.getElementById('proxyToggle').checked = true;
  document.getElementById('serverNodesSelect').value = "4";
  document.getElementById('sslOffloadCheck').checked = true;
  document.getElementById('cookieOptimizationSelect').value = 'optimized';
  document.getElementById('compressionSelect').value = 'brotli';
  document.getElementById('minifyCheck').checked = true;

  sim.calculateMetrics();
  updateChart();

  const simTab = document.querySelector('.nav-tab[data-tab="simulator"]');
  if (simTab) simTab.click();
}

/**
 * Chart.js Response Latency Curve (Pitch Black & Gold Theme)
 */
let latencyChartInstance = null;

function initLatencyChart() {
  const canvas = document.getElementById('latencyChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  
  const studentSteps = [5000, 15000, 25000, 35000, 50000];
  const initialData = calculateCurveData(studentSteps);

  latencyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['5k Users', '15k Users', '25k Users', '35k Users', '50k Peak'],
      datasets: [
        {
          label: 'Current Setup Latency (ms)',
          data: initialData.current,
          borderColor: '#ffbd39',
          backgroundColor: 'rgba(255, 189, 57, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#ffbd39',
          pointRadius: 4
        },
        {
          label: 'Legacy Unoptimized Baseline',
          data: [2800, 6500, 14650, 22000, 35000],
          borderColor: 'rgba(255, 51, 102, 0.6)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          grid: { color: '#1a1a1a' },
          ticks: { color: '#999999', font: { family: 'Inter', size: 10 } }
        },
        y: {
          title: { display: true, text: 'Latency (ms)', color: '#999999' },
          grid: { color: '#1a1a1a' },
          ticks: { color: '#999999', font: { family: 'Inter', size: 10 } },
          min: 0
        }
      },
      plugins: {
        legend: {
          labels: { color: '#ffffff', font: { family: 'Inter', size: 11, weight: 'bold' } }
        },
        tooltip: {
          backgroundColor: '#0c0c0c',
          titleFont: { family: 'Inter', weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono' },
          padding: 10,
          borderColor: 'rgba(255, 189, 57, 0.4)',
          borderWidth: 1
        }
      }
    }
  });

  window.latencyChartInstance = latencyChartInstance;
}

function calculateCurveData(steps) {
  const sim = window.simEngine;
  if (!sim) return { current: [400, 800, 1200, 2000, 3500] };

  const currentValues = steps.map(students => {
    const backup = sim.state.students;
    sim.state.students = students;
    
    const isHttp2 = sim.state.httpVersion === 'http2' || sim.state.httpVersion === 'http3';
    const cacheHit = sim.state.cachingEnabled ? (sim.state.cacheHitRate / 100) : 0;
    const servers = sim.state.proxyEnabled ? sim.state.serverNodes : 1;
    
    const cpu = (students * 0.006 * (1 - cacheHit)) / servers;
    let lat = (sim.state.rtt * (sim.state.httpVersion === 'http10' ? 30 : 2)) + (cpu > 80 ? cpu * 40 : 120);
    if (isHttp2) lat *= 0.5;

    sim.state.students = backup;
    return Math.round(lat);
  });

  return { current: currentValues };
}

function updateChart() {
  if (!latencyChartInstance) return;
  const steps = [5000, 15000, 25000, 35000, 50000];
  const newData = calculateCurveData(steps);
  latencyChartInstance.data.datasets[0].data = newData.current;
  latencyChartInstance.update('none');
}
