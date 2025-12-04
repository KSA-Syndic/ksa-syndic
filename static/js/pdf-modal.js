// ================================================================
// PDF MODAL + VIEWER
// ================================================================

// Global fixes – prevent system zoom & bad gestures
window.addEventListener('wheel', e => {
  if (e.ctrlKey || e.metaKey) e.preventDefault();
}, { passive: false });

const blockBadGestures = e => { if (e.touches.length > 1) e.preventDefault(); };
document.addEventListener('touchstart', blockBadGestures, { passive: false });
document.addEventListener('touchmove',  blockBadGestures,  { passive: false });

// ================================================================
// MODAL LOGIC
// ================================================================
function injectPdfModal(id, html) {
  if (!html) return console.error('[MODAL] No HTML provided');
  document.getElementById(id)?.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  openPdfModal(id);
  initPdfCanvases();
}

function openPdfModal(id) {
  document.body.style.overflow = 'hidden';
  const overlay = document.getElementById(id);
  if (!overlay) return console.error('[MODAL] Overlay not found:', id);
  overlay.style.display = 'flex';
  overlay.onclick = e => { if (e.target === overlay) closePdfModal(id); };
  const escHandler = e => { if (e.key === 'Escape') { closePdfModal(id); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}

function closePdfModal(id) {
  document.body.style.overflow = '';
  document.getElementById(id)?.remove();
}

// ================================================================
// PDF VIEWER
// ================================================================
function initPdfCanvases() {
  if (!window['pdfjs-dist/build/pdf']) return;

  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf-js/build/pdf.worker.js';
  }

  document.querySelectorAll('canvas.pdf-embed-canvas:not([data-initialized])').forEach(canvas => {
    canvas.dataset.initialized = '1';

    const container = canvas.closest('.pdf-embed-container');
    if (!container) return;
    void container.offsetHeight; // force layout

    const id       = canvas.dataset.id;
    const url      = canvas.dataset.url;
    let pageNum    = Math.max(1, parseInt(canvas.dataset.page || '1', 10));

    const loading     = document.getElementById('pdf-loadingWrapper-' + id);
    const pagenumEl   = document.getElementById('pdf-pagenum-' + id);
    const pagecountEl = document.getElementById('pdf-pagecount-' + id);
    const prevBtn     = document.getElementById('pdf-prev-' + id);
    const nextBtn     = document.getElementById('pdf-next-' + id);

    let pdfDoc = null;
    let pageRendering = false;
    let pageNumPending = null;

    // Zoom state – reset to 1 on every page change
    let baseScale = 1;     // auto-fit scale of current page
    let userScale = 1;     // user zoom (1 = fit-to-width)

    const minUserScale = 0.5;
    const maxUserScale = 5;

    const ctx = canvas.getContext('2d');

    function getFinalScale(page) {
      const viewport = page.getViewport({ scale: 1 });
      baseScale = container.clientWidth / viewport.width;
      return baseScale * userScale;
    }

    function renderPage(num) {
      pageRendering = true;
      if (loading) loading.style.display = 'flex';
      canvas.style.display = 'none';

      pdfDoc.getPage(num).then(page => {
        const scale    = getFinalScale(page);
        const viewport = page.getViewport({ scale });
        const dpr      = window.devicePixelRatio || 1;

        canvas.width  = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width  = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        page.render({ canvasContext: ctx, viewport }).promise
          .then(() => {
            pageRendering = false;
            if (loading) loading.style.display = 'none';
            canvas.style.display = 'block';

            if (pagenumEl)   pagenumEl.textContent   = num;
            if (pagecountEl) pagecountEl.textContent = pdfDoc.numPages;
            if (prevBtn)     prevBtn.disabled        = num <= 1;
            if (nextBtn)     nextBtn.disabled        = num >= pdfDoc.numPages;

            if (pageNumPending !== null) {
              renderPage(pageNumPending);
              pageNumPending = null;
            }
          })
          .catch(err => {
            console.error('[PDF] Render failed:', err);
            if (loading) loading.style.display = 'none';
          });
      }).catch(err => {
        console.error('[PDF] Page load failed:', err);
        if (loading) loading.style.display = 'none';
      });
    }

    function setUserScale(newScale) {
      userScale = Math.max(minUserScale, Math.min(maxUserScale, newScale));
      renderPage(pageNum);
    }

    // Wheel zoom
    canvas.addEventListener('wheel', e => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const factor = e.deltaY > 0 ? 0.85 : 1.18;
        setUserScale(userScale * factor);
      }
    }, { passive: false });

    // Pinch zoom
    let pinchStartDist = 0;
    let pinchStartScale = userScale;

    canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        e.stopPropagation();
        pinchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                                   e.touches[0].clientY - e.touches[1].clientY);
        pinchStartScale = userScale;
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        e.stopPropagation();
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                               e.touches[0].clientY - e.touches[1].clientY);
        setUserScale(pinchStartScale * (dist / pinchStartDist));
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => pinchStartDist = 0);

    // NAVIGATION
    function goToPage(n) {
      if (n < 1 || n > pdfDoc.numPages) return;
      pageNum = n;
      userScale = 1;  // ZOOM RESET
      if (pageRendering) {
        pageNumPending = n;
      } else {
        renderPage(n);
      }
    }

    if (prevBtn) prevBtn.onclick = () => goToPage(pageNum - 1);
    if (nextBtn) nextBtn.onclick = () => goToPage(pageNum + 1);

    // Load PDF
    if (loading) loading.style.display = 'flex';
    canvas.style.display = 'none';

    pdfjsLib.getDocument(url).promise.then(doc => {
      pdfDoc = doc;
      pageNum = Math.min(pageNum, pdfDoc.numPages);
      renderPage(pageNum);
    }).catch(err => {
      console.error('[PDF] Load failed:', err);
      if (loading) loading.style.display = 'none';
    });
  });
}

// ================================================================
// GLOBAL EXPORT + INIT
// ================================================================
window.injectPdfModal = injectPdfModal;

document.addEventListener('DOMContentLoaded', () => {
  initPdfCanvases();
});