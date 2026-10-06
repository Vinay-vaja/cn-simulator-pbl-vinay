/**
 * PBL-8 Web Performance Engine - Report & Dossier Module
 * Handles project dossier export and printable formatting
 */

class ProjectReportModule {
  constructor() {
    this.initExportButton();
  }

  initExportButton() {
    const btn = document.getElementById('btnExportReport');
    if (btn) {
      btn.addEventListener('click', () => {
        // Scroll to Results Section then trigger browser print
        const resultsSection = document.getElementById('results');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        setTimeout(() => {
          window.print();
        }, 400);
      });
    }
  }
}

window.projectReport = new ProjectReportModule();
