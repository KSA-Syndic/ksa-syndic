// ================================================================
// GLOBAL FIXES – Prevent system zoom & bad gestures (once)
// ================================================================
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
  if (!html) return console.error('[MODAL] No HTML');
  if (document.getElementById(id)) return openPdfModal(id);
  document.body.insertAdjacentHTML('beforeend', html);
  openPdfModal(id);
  initPdfCanvases();

function openPdfModal(id) {
  document.body.style.overflow = 'hidden';
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.style.display = 'flex';
  overlay.onclick = e => { if (e.target === overlay) closePdfModal(id); };
  const esc = e => { if (e.key === 'Escape') { closePdfModal(id); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);
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

    // Force layout reflow for accurate sizing
    void container.offsetHeight;

    const id       = canvas.dataset.id;
    const url      = canvas.dataset.url;
    let pageNum    = Math.max(1, parseInt(canvas.dataset.page || '1', 10));

    const loading  = document.getElementById('pdf-loadingWrapper-' + id);
    const pagenumEl = document.getElementById('pdf-pagenum-' + id);
    const pagecountEl = document.getElementById('pdf-pagecount-' + id);
    const prevBtn  = document.getElementById('pdf-prev-' + id);
    const nextBtn  = document.getElementById('pdf-next-' + id);

    let pdfDoc = null;
    let pageRendering = false;
    let pageNumPending = null;

    // Scale state
    let baseScale = 1;        // The "fit-to-width" scale of the current page
    let userScale = 1;        // Multiplier applied by user (1 = fit-to-width)

    const minUserScale = 0.5;
    const maxUserScale = 5;

    const ctx = canvas.getContext('2d');

    // ------------------------------------------------------------
    // Core: compute final scale for current page
    // ------------------------------------------------------------
    function getFinalScale(page) {
      const viewport = page.getViewport({ scale: 1 });
      baseScale = container.clientWidth / viewport.width;  // always fit to container width
      return baseScale * userScale;
    }

    // ------------------------------------------------------------
    // Render current page
    // ------------------------------------------------------------
    function renderPage(num) {
      pageRendering = true;
      if (loading) loading.style.display = 'flex';
      canvas.style.display = 'none';

      pdfDoc.getPage(num).then(page => {
        const scale = getFinalScale(page);
        const viewport = page.getViewport({ scale });
        const dpr = window.devicePixelRatio || 1;

        // Exact pixel-perfect sizing → no horizontal scroll ever
        canvas.width  = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width  = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTask.promise.then(() => {
          pageRendering = false;
          if (loading) loading.style.display = 'none';
          canvas.style.display = 'block';

          // Update UI
          if (pagenumEl) pagenumEl.textContent = num;
          if (pagecountEl) pagecountEl.textContent = pdfDoc.numPages;
          if (prevBtn) prevBtn.disabled = num <= 1;
          if (nextBtn) nextBtn.disabled = num >= pdfDoc.numPages;

          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        }).catch(err => {
          console.error('[PDF] Render error:', err);
          if (loading) loading.style.display = 'none';
          canvas.style.display = 'none';
        });
      }).catch(err => {
        console.error('[PDF] Get page error:', err);
        if (loading) loading.style.display = 'none';
        canvas.style.display = 'none';
      });
    }

    // ------------------------------------------------------------
    // Zoom control – userScale only
    // ------------------------------------------------------------
    function setUserScale(newUserScale) {
      userScale = Math.max(minUserScale, Math.min(maxUserScale, newUserScale));
      renderPage(pageNum);
    }

    // Wheel zoom
    canvas.addEventListener('wheel', e => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.85 : 1.18;  // multiplicative (feels natural)
        setUserScale(userScale * delta);
      }
    }, { passive: false });

    // Pinch zoom (mobile)
    let pinchStartDist = 0;
    let pinchStartUserScale = userScale;

    canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        e.stopPropagation();
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartUserScale = userScale;
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        e.stopPropagation();

        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / pinchStartDist;
        setUserScale(pinchStartUserScale * ratio);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => pinchStartDist = 0);

    // ------------------------------------------------------------
    // Page navigation – preserve zoom level
    // ------------------------------------------------------------
    function goToPage(n) {
      if (n < 1 || n > pdfDoc.numPages) return;
      pageNum = n;
      if (pageRendering) {
        pageNumPending = n;
      } else {
        renderPage(n);
      }
    }

    if (prevBtn) prevBtn.onclick = () => goToPage(pageNum - 1);
    if (nextBtn) nextBtn.onclick = () => goToPage(pageNum + 1);

    // ------------------------------------------------------------
    // Load PDF
    // ------------------------------------------------------------
    if (loading) loading.style.display = 'flex';
    canvas.style.display = 'none';

    pdfjsLib.getDocument(url).promise.then(doc => {
      pdfDoc = doc;
      pageNum = Math.min(pageNum, pdfDoc.numPages);

      // Initial render (userScale = 1 → perfect fit)
      renderPage(pageNum);
    }).catch(err => {
      console.error('[PDF] Load error:', err);
      if (loading) loading.style.display = 'none';
    });
  });
}

// ================================================================
document.addEventListener('DOMContentLoaded', initPdfCanvases);