/**
 * PBL-8 Web Performance Engine - Main Controller (White + Green Edition)
 * Orchestrates 6-Tab Smooth Navigation, Live Metrics, Chart.js Stress Curve & Presets
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScrollSpy();
  initSimulationControls();
  initPresets();
  initLatencyChart();

  // Initial Calculation
  if (window.simEngine) {
    window.simEngine.calculateMetrics();
  }

  // Render Mathematical LaTeX Formulas
  if (window.renderMathInElement) {
    window.renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });
  }
});

/**
 * 6-Tab Smooth Scrolling & Active State Spy
 */
function initNavbarScrollSpy() {
  const navLinks = document.querySelectorAll('.header-nav-tabs .nav-tab');
  const sections = document.querySelectorAll('.pbl-section');

  // Click handler for smooth scrolling
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // IntersectionObserver to highlight active tab while scrolling
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('data-target') === id) {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
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
  const proxyToggle = document.getElementById('proxyToggle');
  const serverNodesSelect = document.getElementById('serverNodesSelect');
  const cookieSelect = document.getElementById('cookieOptimizationSelect');
  const compressionSelect = document.getElementById('compressionSelect');

  const btnReset = document.getElementById('btnResetControls');
  const btnRunBurst = document.getElementById('btnRunSim');

  // Overview status element sync
  const updateOverviewStats = () => {
    const elOverviewStudents = document.getElementById('overviewStudentsCount');
    const elOverviewPlt = document.getElementById('overviewPltCount');
    if (elOverviewStudents) elOverviewStudents.innerText = `${sim.state.students.toLocaleString()} Concurrent Students`;
    if (elOverviewPlt) elOverviewPlt.innerText = `${sim.state.pageLoadTime} ms (Optimal)`;
  };

  if (studentSlider) {
    studentSlider.addEventListener('input', (e) => {
      sim.state.students = parseInt(e.target.value);
      sim.calculateMetrics();
      updateChart();
      updateOverviewStats();
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

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      loadOptimizedPreset();
    });
  }

  if (btnRunBurst) {
    btnRunBurst.addEventListener('click', () => {
      btnRunBurst.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Simulating Surge...';
      sim.state.students = Math.min(50000, sim.state.students + 10000);
      if (studentSlider) studentSlider.value = sim.state.students;
      sim.calculateMetrics();
      updateChart();
      updateOverviewStats();

      for (let i = 0; i < 15; i++) {
        setTimeout(() => sim.spawnPacket(0, 1, 'get'), i * 35);
      }

      setTimeout(() => {
        btnRunBurst.innerHTML = '<i class="fa-solid fa-play"></i> Simulate 10k Surge Burst';
      }, 1000);
    });
  }
}

/**
 * Presets (Crash vs Ultra-Fast)
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
  sim.state.cacheHitRate = 10;
  sim.state.proxyEnabled = false;
  sim.state.serverNodes = 1;
  sim.state.cookieMode = 'bloated';
  sim.state.compression = 'none';

  // Sync inputs
  const studentSlider = document.getElementById('studentSlider');
  const rttSlider = document.getElementById('rttSlider');
  const httpSelect = document.getElementById('httpVersionSelect');
  const cacheToggle = document.getElementById('cacheToggle');
  const proxyToggle = document.getElementById('proxyToggle');
  const serverNodes = document.getElementById('serverNodesSelect');
  const cookieSelect = document.getElementById('cookieOptimizationSelect');
  const compSelect = document.getElementById('compressionSelect');

  if (studentSlider) studentSlider.value = 35000;
  if (rttSlider) rttSlider.value = 120;
  if (httpSelect) httpSelect.value = 'http10';
  if (cacheToggle) cacheToggle.checked = false;
  if (proxyToggle) proxyToggle.checked = false;
  if (serverNodes) serverNodes.value = "1";
  if (cookieSelect) cookieSelect.value = 'bloated';
  if (compSelect) compSelect.value = 'none';

  sim.calculateMetrics();
  updateChart();

  // Scroll to simulator section
  const simSec = document.getElementById('simulator');
  if (simSec) simSec.scrollIntoView({ behavior: 'smooth' });
}

function loadOptimizedPreset() {
  const sim = window.simEngine;
  if (!sim) return;

  sim.state.students = 25000;
  sim.state.rtt = 60;
  sim.state.httpVersion = 'http2';
  sim.state.cachingEnabled = true;
  sim.state.cacheHitRate = 92;
  sim.state.proxyEnabled = true;
  sim.state.serverNodes = 4;
  sim.state.cookieMode = 'optimized';
  sim.state.compression = 'brotli';

  const studentSlider = document.getElementById('studentSlider');
  const rttSlider = document.getElementById('rttSlider');
  const httpSelect = document.getElementById('httpVersionSelect');
  const cacheToggle = document.getElementById('cacheToggle');
  const hitSlider = document.getElementById('cacheHitSlider');
  const hitLabel = document.getElementById('cacheHitRateLabel');
  const proxyToggle = document.getElementById('proxyToggle');
  const serverNodes = document.getElementById('serverNodesSelect');
  const cookieSelect = document.getElementById('cookieOptimizationSelect');
  const compSelect = document.getElementById('compressionSelect');

  if (studentSlider) studentSlider.value = 25000;
  if (rttSlider) rttSlider.value = 60;
  if (httpSelect) httpSelect.value = 'http2';
  if (cacheToggle) cacheToggle.checked = true;
  if (hitSlider) hitSlider.value = 92;
  if (hitLabel) hitLabel.innerText = '92%';
  if (proxyToggle) proxyToggle.checked = true;
  if (serverNodes) serverNodes.value = "4";
  if (cookieSelect) cookieSelect.value = 'optimized';
  if (compSelect) compSelect.value = 'brotli';

  sim.calculateMetrics();
  updateChart();

  const simSec = document.getElementById('simulator');
  if (simSec) simSec.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Chart.js Response Latency Stress Curve (White + Green Professional Palette)
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
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.08)',
          borderWidth: 2.5,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#16a34a',
          pointRadius: 4
        },
        {
          label: 'Legacy Baseline',
          data: [2800, 6500, 14650, 22000, 35000],
          borderColor: '#dc2626',
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
          grid: { color: '#f1f5f9' },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } }
        },
        y: {
          title: { display: true, text: 'Latency (ms)', color: '#64748b' },
          grid: { color: '#f1f5f9' },
          ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
          min: 0
        }
      },
      plugins: {
        legend: {
          labels: { color: '#0f172a', font: { family: 'Inter', size: 11, weight: 'bold' } }
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#0f172a',
          bodyColor: '#475569',
          titleFont: { family: 'Inter', weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono' },
          padding: 8,
          borderColor: '#e2e8f0',
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
