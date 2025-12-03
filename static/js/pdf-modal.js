
// --- Modal logic ---
function injectPdfModal(id, html) {
  console.log('[MODAL] injectPdfModal called for', id);
  if (!html) {
    console.error('[MODAL] Aucun HTML modal fourni pour l’id :', id);
    return;
  }
  if (!document.getElementById(id)) {
    document.body.insertAdjacentHTML('beforeend', html);
    const overlay = document.getElementById(id);
    if (overlay) {
      console.log('[MODAL] Overlay injecté dans le DOM pour', id);
      openPdfModal(id);
    } else {
      console.error('[MODAL] Erreur : le modal PDF n’a pas pu être injecté dans le DOM (id=' + id + ').');
    }
  } else {
    console.log('[MODAL] Overlay déjà présent, ouverture directe pour', id);
    openPdfModal(id);
  }
}

function openPdfModal(id) {
  console.log('[MODAL] openPdfModal called for', id);
  document.body.style.overflow = 'hidden';
  const overlay = document.getElementById(id);
  if (!overlay) {
    console.warn('[MODAL] Overlay introuvable pour', id);
    return;
  }
  overlay.style.display = 'flex';
  overlay.onclick = function (e) {
    if (e.target === overlay) {
      console.log('[MODAL] Click sur overlay, fermeture pour', id);
      closePdfModal(id);
    }
  };
  function escListener(ev) {
    if (ev.key === 'Escape') {
      console.log('[MODAL] Touche Escape pressée, fermeture pour', id);
      closePdfModal(id);
      document.removeEventListener('keydown', escListener);
    }
  }
  document.addEventListener('keydown', escListener);
  console.log('[MODAL] Modal ouvert pour', id);
}

function closePdfModal(id) {
  console.log('[MODAL] closePdfModal called for', id);
  document.body.style.overflow = '';
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.parentNode.removeChild(overlay);
    console.log('[MODAL] Overlay supprimé du DOM pour', id);
  } else {
    console.warn('[MODAL] Overlay déjà absent pour', id);
  }
}

// --- PDF.js viewer logic ---

function initPdfCanvases() {
  console.log('[PDF] initPdfCanvases called');
  if (!window['pdfjs-dist/build/pdf']) return;
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  if (pdfjsLib.GlobalWorkerOptions.workerSrc === '') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf-js/build/pdf.worker.js';
  }
  const pdfCanvases = document.querySelectorAll('canvas.pdf-embed-canvas');
  console.log('[PDF] Canvases trouvés:', pdfCanvases.length);
  pdfCanvases.forEach(function(canvas) {
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

    console.log('[PDF] Initialisation canvas:', {id, url, page, loadingWrapper, pagenumEl, pagecountEl, prevBtn, nextBtn});

    function waitForNavElements(cb) {
      if ((prevBtn && nextBtn && pagenumEl && pagecountEl) || (!document.getElementById('pdf-prev-' + id) && !document.getElementById('pdf-next-' + id))) {
        console.log('[PDF] Navigation elements ready for', id);
        cb();
      } else {
        setTimeout(function() {
          waitForNavElements(cb);
        }, 50);
      }
    }

    function renderPage(num) {
      pageRendering = true;
      if (loadingWrapper) {
        loadingWrapper.style.display = 'flex';
        console.log('[PDF] Loader affiché pour', id);
      }
      canvas.style.display = 'none';
      console.log('[PDF] Rendu page', num, 'pour', id);
      pdfDoc.getPage(num).then(function(page) {
        let usedScale = scale;
        const parent = canvas.closest('.pdf-embed-container');
        if (scale === 1 && parent) {
          // Calcule le scale pour que le PDF remplisse exactement la largeur visible du container
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
        console.log('[PDF] Canvas dimensions (fit parent, ratio ok) pour', id, {displayWidth, displayHeight, usedScale});
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const renderContext = {canvasContext: ctx, viewport: viewport};
        const renderTask = page.render(renderContext);
        renderTask.promise.then(function() {
          pageRendering = false;
          if (loadingWrapper) {
            loadingWrapper.style.display = 'none';
            console.log('[PDF] Loader masqué pour', id);
          }
          canvas.style.display = 'block';
          console.log('[PDF] Page', num, 'affichée pour', id);
          waitForNavElements(function() {
            if (pagenumEl) pagenumEl.textContent = num;
            if (pagecountEl) pagecountEl.textContent = pdfDoc.numPages;
            if (prevBtn) prevBtn.disabled = (num <= 1);
            if (nextBtn) nextBtn.disabled = (num >= pdfDoc.numPages);
            console.log('[PDF] Navigation mise à jour pour', id);
          });
          if (pageNumPending !== null) {
            console.log('[PDF] Page en attente, relance renderPage', pageNumPending);
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
      console.log('[PDF] Zoom changé pour', id, '->', scale);
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
        console.log('[PDF] Pinch start', lastDist);
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
        console.log('[PDF] Pinch move', newDist, 'delta', delta);
      }
    }, { passive: false });
    canvas.addEventListener('touchend', function(e) {
      if (e.touches.length < 2) lastDist = null;
      console.log('[PDF] Pinch end');
    });

    function queueRenderPage(num) {
      setZoom(1, true);
      if (pageRendering) {
        pageNumPending = num;
        console.log('[PDF] Page rendering en cours, mise en attente', num);
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
          console.log('[PDF] Prev page', pageNum);
          queueRenderPage(pageNum);
        };
      }
      if (nextBtn) {
        nextBtn.onclick = function() {
          if (pageNum >= pdfDoc.numPages) return;
          pageNum++;
          console.log('[PDF] Next page', pageNum);
          queueRenderPage(pageNum);
        };
      }
    }
    if (loadingWrapper) {
      loadingWrapper.style.display = 'flex';
      console.log('[PDF] Loader initialisé pour', id);
    }
    canvas.style.display = 'none';
    console.log('[PDF] Canvas masqué pour', id);
    pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
      pdfDoc = pdfDoc_;
      console.log('[PDF] PDF chargé pour', id, pdfDoc);
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
  console.log('[PDF] DOMContentLoaded event triggered');
  initPdfCanvases();
});

function injectPdfModal(id, html) {
  console.log('[MODAL] injectPdfModal called for', id);
  if (!html) {
    console.error('[MODAL] Aucun HTML modal fourni pour l’id :', id);
    return;
  }
  if (!document.getElementById(id)) {
    document.body.insertAdjacentHTML('beforeend', html);
    const overlay = document.getElementById(id);
    if (overlay) {
      console.log('[MODAL] Overlay injecté dans le DOM pour', id);
      initPdfCanvases();
      openPdfModal(id);
    } else {
      console.error('[MODAL] Erreur : le modal PDF n’a pas pu être injecté dans le DOM (id=' + id + ').');
    }
  } else {
    console.log('[MODAL] Overlay déjà présent, ouverture directe pour', id);
    openPdfModal(id);
  }
}
