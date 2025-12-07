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

    // --- ZOOM STATE ---
    let baseScale = 1;     // auto-fit scale of current page
    let userScale = 1;     // user zoom (1 = fit-to-width)
    const minUserScale = 0.5;
    const maxUserScale = 5;
    const ctx = canvas.getContext('2d');
    let zoomCenter = { x: 0.5, y: 0.5 }; // centre relatif (0..1)

    function getFinalScale(page) {
      const viewport = page.getViewport({ scale: 1 });
      baseScale = container.clientWidth / viewport.width;
      return baseScale * userScale;
    }

    function renderPage(num) {
      pageRendering = true;
      if (loading) loading.style.display = 'flex';
      canvas.style.display = 'none';

      // --- Scroll Center Preservation ---
      const parent = canvas.parentElement;
      // Si c'est le premier rendu, force le scroll en haut de page
      let restoreScrollCenter = zoomCenter || { x: 0.5, y: 0.5 };
      if (typeof renderPage.first === 'undefined') {
        restoreScrollCenter = { x: restoreScrollCenter.x, y: 0 };
        renderPage.first = false;
      }

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

            // --- Restore scroll center after render ---
            if (parent && restoreScrollCenter) {
              const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
              const pw = parent.offsetWidth, ph = parent.offsetHeight;
              // Si premier rendu, force scroll en haut
              if (renderPage.first === true) {
                parent.scrollTop = 0;
                zoomCenter.y = 0;
                renderPage.first = false;
              } else {
                parent.scrollLeft = Math.max(0, (cw * restoreScrollCenter.x) - pw / 2);
                parent.scrollTop  = Math.max(0, (ch * restoreScrollCenter.y) - ph / 2);
              }
            }

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

    // --- ZOOM LOGIC ---
    let pendingScale = null;
    let pinchActive = false;
    let ctrlActive = false;

    // --- ZOOM TRANSITION & SCROLL ---
    let lastZoomCenter = { x: 0.5, y: 0.5 };
    function getZoomCenter(e) {
      // Pour wheel : centre du canvas, pour pinch : centre des doigts
      if (e && e.touches && e.touches.length === 2) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const y = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        return { x: x / rect.width, y: y / rect.height };
      }
      // Pour wheel, centre du canvas
      return { x: 0.5, y: 0.5 };
    }

    function applyTransformScale(scale, center = lastZoomCenter) {
      canvas.style.transformOrigin = `${center.x * 100}% ${center.y * 100}%`;
      canvas.style.transform = `scale(${scale})`;
      canvas.style.transition = 'transform 0.1s';
      lastZoomCenter = center;
    }
    function clearTransformScale() {
      canvas.style.transform = '';
      canvas.style.transition = '';
      canvas.style.transformOrigin = '';
    }

    function adjustScrollAfterRender(center) {
      // centre = {x: 0..1, y: 0..1} relatif au canvas
      const parent = canvas.parentElement;
      if (!parent || !canvas) return;
      const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
      const pw = parent.offsetWidth, ph = parent.offsetHeight;
      // centre du zoom dans le parent
      const targetX = Math.max(0, (cw * center.x) - pw / 2);
      const targetY = Math.max(0, (ch * center.y) - ph / 2);
      parent.scrollLeft = targetX;
      parent.scrollTop = targetY;
    }

    function setUserScale(newScale, render = true) {
      // Cumul du zoom, pas de reset
      userScale = Math.max(minUserScale, Math.min(maxUserScale, newScale));
      if (render) renderPage(pageNum);
    }

    // --- WHEEL ZOOM (Ctrl) ---
    canvas.addEventListener('wheel', e => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const factor = e.deltaY > 0 ? 0.85 : 1.18;
        const newScale = Math.max(minUserScale, Math.min(maxUserScale, userScale * factor));
        // Centre du zoom relatif à la position souris
        const rect = canvas.getBoundingClientRect();
        zoomCenter = {
          x: ((e.clientX - rect.left) / rect.width),
          y: ((e.clientY - rect.top) / rect.height)
        };
        userScale = newScale;
        renderPage(pageNum);
      }
    }, { passive: false });

    // --- PINCH ZOOM (Mobile) ---
    let pinchStartDist = 0;
    let pinchStartScale = userScale;
    canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartScale = userScale;
        // Centre du pinch
        const rect = canvas.getBoundingClientRect();
        zoomCenter = {
          x: ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / rect.width,
          y: ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / rect.height
        };
      }
    }, { passive: false });
    let pinchLiveScale = 1;
    canvas.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const pinchScale = dist / pinchStartDist;
        pinchLiveScale = Math.max(minUserScale, Math.min(maxUserScale, pinchStartScale * pinchScale));
        // Zoom visuel temporaire
        applyTransformScale(pinchLiveScale, zoomCenter);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
      // Fin du pinch : applique le zoom réel et relance le rendu PDF.js
      if (pinchStartDist > 0) {
        userScale = pinchLiveScale;
        clearTransformScale();
        renderPage(pageNum);
        pinchStartDist = 0;
      }
    });

    // NAVIGATION
    function goToPage(n) {
      if (n < 1 || n > pdfDoc.numPages) return;
      pageNum = n;
      userScale = 1;  // ZOOM RESET
      zoomCenter = { x: 0.5, y: 0 }; // Reset scroll en haut à chaque page
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
      zoomCenter = { x: 0.5, y: 0 }; // Reset scroll en haut à chaque nouveau document
      renderPage.first = true;
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