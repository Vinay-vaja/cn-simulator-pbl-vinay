/**
 * PBL-8 Web Performance Engine - Report & Evaluator Quiz Module
 * Handles project dossier export, printable formatting, and interactive knowledge quiz
 */

class ProjectReportModule {
  constructor() {
    this.quizQuestions = [
      {
        id: 1,
        question: "Why does HTTP/1.0 (Non-Persistent) cause severe latency on web pages with dozens of static assets?",
        options: [
          { text: "It compresses all images using JPEG instead of WebP", isCorrect: false },
          { text: "Every asset requires a separate TCP 3-way handshake and connection teardown, multiplying RTT delays", isCorrect: true },
          { text: "It limits bandwidth to 100 KB/s globally", isCorrect: false },
          { text: "It prevents browsers from rendering CSS", isCorrect: false }
        ],
        explanation: "In HTTP/1.0, each request requires opening and closing a separate TCP socket, resulting in 2 RTTs per resource plus TLS handshake overhead."
      },
      {
        id: 2,
        question: "What HTTP response header status code indicates a successful conditional validation where 0 payload bytes are transmitted?",
        options: [
          { text: "200 OK", isCorrect: false },
          { text: "206 Partial Content", isCorrect: false },
          { text: "304 Not Modified", isCorrect: true },
          { text: "504 Gateway Timeout", isCorrect: false }
        ],
        explanation: "HTTP 304 Not Modified tells the client's browser to reuse the local cached copy because the ETag / Last-Modified date matches."
      },
      {
        id: 3,
        question: "How does a Reverse Proxy (such as Nginx) prevent single origin web servers from collapsing during admission rushes?",
        options: [
          { text: "It deletes applicant records after 5 minutes", isCorrect: false },
          { text: "It distributes traffic across multiple backend nodes, performs SSL offloading, and caches static requests", isCorrect: true },
          { text: "It disables HTTPS encryption permanently", isCorrect: false },
          { text: "It converts all GET requests into POST requests", isCorrect: false }
        ],
        explanation: "Reverse proxies distribute traffic across multiple origin servers (Load Balancing), handle SSL handshakes (SSL Offloading), and serve cached assets from edge nodes."
      },
      {
        id: 4,
        question: "Why should static assets (CSS, JS, images) be served from a 'Cookie-Free Domain' (e.g., static.college-cdn.com)?",
        options: [
          { text: "Cookies are illegal on images", isCorrect: false },
          { text: "To prevent browsers from attaching useless multi-kilobyte session/tracking cookies to every static asset request", isCorrect: true },
          { text: "It automatically increases image resolution", isCorrect: false },
          { text: "Cookies break browser caching completely", isCorrect: false }
        ],
        explanation: "Browsers attach all matching domain cookies to every request. Using a cookie-free domain eliminates gigabytes of wasted upstream header bandwidth during high concurrency."
      },
      {
        id: 5,
        question: "Which cookie security flag prevents malicious JavaScript scripts from accessing sensitive admission session tokens during an XSS attack?",
        options: [
          { text: "HttpOnly", isCorrect: true },
          { text: "SameSite=None", isCorrect: false },
          { text: "Max-Age=0", isCorrect: false },
          { text: "Domain=.all", isCorrect: false }
        ],
        explanation: "The HttpOnly flag blocks JavaScript document.cookie access, protecting session tokens from Cross-Site Scripting (XSS) theft."
      }
    ];

    this.initQuiz();
    this.initExportButton();
  }

  initQuiz() {
    const container = document.getElementById('quizQuestionsList');
    if (!container) return;

    let html = '';
    this.quizQuestions.forEach((q, qIndex) => {
      html += `
        <div class="quiz-q-card" data-qid="${q.id}">
          <div class="q-title">Q${qIndex + 1}: ${q.question}</div>
          <div class="q-options">
            ${q.options.map((opt, optIndex) => `
              <label class="q-opt-label">
                <input type="radio" name="q_${q.id}" value="${optIndex}">
                <span>${opt.text}</span>
              </label>
            `).join('')}
          </div>
          <div class="q-feedback d-none" id="qFeedback_${q.id}"></div>
        </div>
      `;
    });

    container.innerHTML = html;

    const btnSubmit = document.getElementById('btnSubmitQuiz');
    const scoreBanner = document.getElementById('quizScoreBanner');

    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        let correctCount = 0;
        let totalCount = this.quizQuestions.length;

        this.quizQuestions.forEach(q => {
          const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
          const feedbackEl = document.getElementById(`qFeedback_${q.id}`);
          
          if (!feedbackEl) return;
          feedbackEl.classList.remove('d-none');

          if (selected) {
            const selectedIdx = parseInt(selected.value);
            const isCorrect = q.options[selectedIdx].isCorrect;

            if (isCorrect) {
              correctCount++;
              feedbackEl.className = 'q-feedback text-success fw-bold mt-2';
              feedbackEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Correct! ${q.explanation}`;
            } else {
              feedbackEl.className = 'q-feedback text-danger fw-bold mt-2';
              feedbackEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Incorrect. ${q.explanation}`;
            }
          } else {
            feedbackEl.className = 'q-feedback text-warning fw-bold mt-2';
            feedbackEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Unanswered. ${q.explanation}`;
          }
        });

        if (scoreBanner) {
          scoreBanner.classList.remove('d-none');
          const percent = Math.round((correctCount / totalCount) * 100);
          scoreBanner.innerHTML = `
            <div style="font-size: 1.3rem;"><i class="fa-solid fa-trophy"></i> Evaluation Score: ${correctCount} / ${totalCount} (${percent}%)</div>
            <p style="font-size: 0.85rem; font-weight: 500; margin-top: 4px; color: #cbd5e1;">
              ${percent >= 80 ? 'Outstanding! Mastery of Web Performance Architecture validated.' : 'Good attempt. Review the 5-Pillar Deep Dive tabs to strengthen key concepts.'}
            </p>
          `;
        }
      });
    }
  }

  initExportButton() {
    const btn = document.getElementById('btnExportReport');
    if (btn) {
      btn.addEventListener('click', () => {
        // Switch to Dossier Tab then trigger browser print
        const tabBtn = document.querySelector('.nav-tab[data-tab="dossier"]');
        if (tabBtn) tabBtn.click();
        setTimeout(() => {
          window.print();
        }, 300);
      });
    }
  }
}

window.projectReport = new ProjectReportModule();
