

// --- Modal logic ---
function injectPdfModal(id, html) {
  if (!html) {
    console.error('[MODAL] Aucun HTML modal fourni pour l’id :', id);
    return;
  }
  if (!document.getElementById(id)) {
    document.body.insertAdjacentHTML('beforeend', html);
    const overlay = document.getElementById(id);
    if (overlay) {
      initPdfCanvases();
      openPdfModal(id);
    } else {
      console.error('[MODAL] Erreur : le modal PDF n’a pas pu être injecté dans le DOM (id=' + id + ').');
    }
  } else {
    openPdfModal(id);
  }
}

function openPdfModal(id) {
  document.body.style.overflow = 'hidden';
  const overlay = document.getElementById(id);
  if (!overlay) {
    console.error('[MODAL] Overlay introuvable pour', id);
    return;
  }
  overlay.style.display = 'flex';
  overlay.onclick = function (e) {
    if (e.target === overlay) closePdfModal(id);
  };
  function escListener(ev) {
    if (ev.key === 'Escape') {
      closePdfModal(id);
      document.removeEventListener('keydown', escListener);
    }
  }
  document.addEventListener('keydown', escListener);
}

function closePdfModal(id) {
  document.body.style.overflow = '';
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.parentNode.removeChild(overlay);
  }
}

// --- PDF.js viewer logic ---
function initPdfCanvases() {
  if (!window['pdfjs-dist/build/pdf']) return;
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  if (pdfjsLib.GlobalWorkerOptions.workerSrc === '') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf-js/build/pdf.worker.js';
  }
  document.querySelectorAll('canvas.pdf-embed-canvas').forEach(function(canvas) {
    if (canvas.dataset.initialized) return;
    canvas.dataset.initialized = '1';
    const id = canvas.getAttribute('data-id');
    const url = canvas.getAttribute('data-url');
    const page = parseInt(canvas.getAttribute('data-page') || '1', 10);
    const loadingWrapper = document.getElementById('pdf-loadingWrapper-' + id);
    const pagenumEl = document.getElementById('pdf-pagenum-' + id);
    const pagecountEl = document.getElementById('pdf-pagecount-' + id);
    const prevBtn = document.getElementById('pdf-prev-' + id);
    const nextBtn = document.getElementById('pdf-next-' + id);
    let pdfDoc = null, pageNum = page, pageRendering = false, pageNumPending = null, scale = 1;
    const minScale = 0.5, maxScale = 5;
    const ctx = canvas.getContext('2d');

    function waitForNavElements(cb) {
      if ((prevBtn && nextBtn && pagenumEl && pagecountEl) || (!document.getElementById('pdf-prev-' + id) && !document.getElementById('pdf-next-' + id))) {
        cb();
      } else {
        setTimeout(function() { waitForNavElements(cb); }, 50);
      }
    }

    function renderPage(num) {
      pageRendering = true;
      if (loadingWrapper) loadingWrapper.style.display = 'flex';
      canvas.style.display = 'none';
      pdfDoc.getPage(num).then(function(page) {
        let usedScale = scale;
        const parent = canvas.closest('.pdf-embed-container');
        if (scale === 1 && parent) {
          const parentRect = parent.getBoundingClientRect();
          const parentWidth = parentRect.width;
          const viewport1 = page.getViewport({scale: 1});
          usedScale = parentWidth / viewport1.width;
        }
        const viewport = page.getViewport({scale: usedScale});
        const dpr = window.devicePixelRatio || 1;
        let displayWidth = viewport.width;
        let displayHeight = viewport.height;
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const renderContext = {canvasContext: ctx, viewport: viewport};
        const renderTask = page.render(renderContext);
        renderTask.promise.then(function() {
          pageRendering = false;
          if (loadingWrapper) loadingWrapper.style.display = 'none';
          canvas.style.display = 'block';
          waitForNavElements(function() {
            if (pagenumEl) pagenumEl.textContent = num;
            if (pagecountEl) pagecountEl.textContent = pdfDoc.numPages;
            if (prevBtn) prevBtn.disabled = (num <= 1);
            if (nextBtn) nextBtn.disabled = (num >= pdfDoc.numPages);
          });
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        }).catch(function(err) {
          if (loadingWrapper) loadingWrapper.style.display = 'none';
          canvas.style.display = 'none';
          console.error('[PDF] Erreur lors du rendu de la page PDF :', err);
        });
      }).catch(function(err) {
        if (loadingWrapper) loadingWrapper.style.display = 'none';
        canvas.style.display = 'none';
        console.error('[PDF] Erreur lors de l’accès à la page PDF :', err);
      });
    }

    function setZoom(newScale) {
      scale = Math.min(maxScale, Math.max(minScale, newScale));
      renderPage(pageNum);
    }

    canvas.addEventListener('wheel', function(e) {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setZoom(scale + delta);
      }
    }, { passive: false });

    // Pinch-zoom sur mobile
    let lastDist = null;
    canvas.addEventListener('touchstart', function(e) {
      if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });
    canvas.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2 && lastDist !== null) {
        e.preventDefault();
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (newDist - lastDist) / 200;
        setZoom(scale + delta);
        lastDist = newDist;
      }
    }, { passive: false });
    canvas.addEventListener('touchend', function(e) {
      if (e.touches.length < 2) lastDist = null;
    });

    function queueRenderPage(num) {
      setZoom(1, true);
      if (pageRendering) {
        pageNumPending = num;
      }
      else {
        renderPage(num);
      }
    }
    function bindNav() {
      if (prevBtn) {
        prevBtn.onclick = function() {
          if (pageNum <= 1) return;
          pageNum--;
          queueRenderPage(pageNum);
        };
      }
      if (nextBtn) {
        nextBtn.onclick = function() {
          if (pageNum >= pdfDoc.numPages) return;
          pageNum++;
          queueRenderPage(pageNum);
        };
      }
    }
    if (loadingWrapper) loadingWrapper.style.display = 'flex';
    canvas.style.display = 'none';
    pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
      pdfDoc = pdfDoc_;
      if (pageNum > pdfDoc.numPages) pageNum = pdfDoc.numPages;
      waitForNavElements(bindNav);
      renderPage(pageNum);
    }).catch(function(err) {
      if (loadingWrapper) loadingWrapper.style.display = 'none';
      canvas.style.display = 'none';
      console.error('[PDF] Erreur lors du chargement du PDF :', err);
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initPdfCanvases();
});
