// small script to toggle mobile menu
document.addEventListener('DOMContentLoaded', function () {
  // Skeleton shimmer placeholder for every image, site-wide
  document.querySelectorAll('img').forEach(img => {
    function markLoaded() {
      img.classList.remove('img-loading');
      img.classList.add('img-loaded');
    }
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('img-loaded');
    } else {
      img.classList.add('img-loading');
      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', markLoaded, { once: true });
    }
  });

  const hamburgerButtons = document.querySelectorAll('.hamburger');
  hamburgerButtons.forEach(btn => {
    const id = btn.id;
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      document.body.classList.toggle('mobile-nav-open');
    });
  });

  // Close mobile menu when clicking nav links
  document.querySelectorAll('.nav a').forEach(a => {
    a.addEventListener('click', () => {
      document.body.classList.remove('mobile-nav-open');
      document.querySelectorAll('.hamburger').forEach(h => h.classList.remove('active'));
    });
  });

  // Close mobile menu when clicking outside it (on the blurred backdrop)
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('mobile-nav-open')) return;
    const nav = document.querySelector('.nav');
    const isHamburger = e.target.closest('.hamburger');
    if (nav && !nav.contains(e.target) && !isHamburger) {
      document.body.classList.remove('mobile-nav-open');
      document.querySelectorAll('.hamburger').forEach(h => h.classList.remove('active'));
    }
  });

  // Turn the navbar into a floating rounded pill once the page is scrolled
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    let headerTicking = false;
    function updateHeaderScrollState() {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 10);
      headerTicking = false;
    }
    function onHeaderScroll() {
      if (headerTicking) return;
      headerTicking = true;
      requestAnimationFrame(updateHeaderScrollState);
    }
    updateHeaderScrollState();
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
  }

  // Start horizontally-scrolling project rows centered, so users can scroll either direction
  function centerCardsRows() {
    document.querySelectorAll('.cards-row').forEach(row => {
      if (row.scrollWidth > row.clientWidth) {
        row.scrollLeft = (row.scrollWidth - row.clientWidth) / 2;
      }
    });
  }
  centerCardsRows();
  window.addEventListener('resize', centerCardsRows);

  // Word-by-word scroll reveal on the About band (pinned section, all screen sizes)
  const revealSection = document.querySelector('.home-about');
  const revealParagraphs = document.querySelectorAll('.reveal-text');
  if (revealSection && revealParagraphs.length) {
    revealParagraphs.forEach(p => {
      const words = p.textContent.split(/\s+/).filter(Boolean);
      p.innerHTML = words.map(w => `<span class="reveal-word">${w}</span>`).join(' ');
    });
    const revealWords = document.querySelectorAll('.reveal-word');

    function updateReveal() {
      const rect = revealSection.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 1;
      const activeCount = Math.floor(progress * revealWords.length);
      revealWords.forEach((word, i) => {
        word.style.opacity = i < activeCount ? 1 : '';
      });
    }
    updateReveal();
    window.addEventListener('scroll', updateReveal, { passive: true });
    window.addEventListener('resize', updateReveal);
  }

  // Case-study TOC: highlight the link for the section currently in view
  const tocLinks = document.querySelectorAll('.cs-toc a');
  if (tocLinks.length) {
    const tocSections = [...tocLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        const activeIndex = [...tocLinks].findIndex(a => a.getAttribute('href') === '#' + id);
        tocLinks.forEach((a, i) => {
          a.classList.toggle('active', i === activeIndex);
          a.classList.toggle('completed', i < activeIndex);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    tocSections.forEach(sec => observer.observe(sec));
  }

  // Image lightbox — case-study project pages only
  if (document.body.classList.contains('cs-page')) {
    const lightbox = document.createElement('div');
    lightbox.className = 'cs-lightbox';
    lightbox.innerHTML = '<button class="cs-lightbox-close" aria-label="Close image">&times;</button><img class="cs-lightbox-img" src="" alt="">';
    document.body.appendChild(lightbox);
    const lightboxImg = lightbox.querySelector('.cs-lightbox-img');
    const lightboxClose = lightbox.querySelector('.cs-lightbox-close');

    // Zoom/pan state — only active while the lightbox is open
    let scale = 1, panX = 0, panY = 0;
    const MIN_SCALE = 1, MAX_SCALE = 5;

    function applyTransform() {
      lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
      lightboxImg.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    }
    function resetZoom() {
      scale = 1; panX = 0; panY = 0;
      applyTransform();
    }
    function setScale(newScale) {
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
      if (scale === 1) { panX = 0; panY = 0; }
      applyTransform();
    }

    function openLightbox(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      resetZoom();
      lightbox.classList.add('active');
      document.body.classList.add('cs-lightbox-open');
    }
    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.classList.remove('cs-lightbox-open');
      resetZoom();
    }
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // Scroll-wheel zoom (desktop), only while the lightbox is open
    lightbox.addEventListener('wheel', (e) => {
      if (!lightbox.classList.contains('active')) return;
      e.preventDefault();
      setScale(scale - e.deltaY * 0.0025);
    }, { passive: false });

    // Double-click to toggle zoomed in/out
    lightboxImg.addEventListener('dblclick', (e) => {
      e.preventDefault();
      window.getSelection().removeAllRanges();
      setScale(scale > 1 ? 1 : 2.5);
    });
    // Prevent the second click of the double-click from selecting page text
    lightbox.addEventListener('mousedown', (e) => {
      if (e.detail > 1) e.preventDefault();
    });

    // Drag to pan when zoomed in (mouse)
    let isDragging = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
    lightboxImg.addEventListener('mousedown', (e) => {
      if (scale <= 1) return;
      isDragging = true;
      dragStartX = e.clientX; dragStartY = e.clientY;
      panStartX = panX; panStartY = panY;
      lightboxImg.style.cursor = 'grabbing';
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panX = panStartX + (e.clientX - dragStartX);
      panY = panStartY + (e.clientY - dragStartY);
      applyTransform();
    });
    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      lightboxImg.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    });

    // Pinch to zoom (touch)
    let pinchStartDist = 0, pinchStartScale = 1;
    lightboxImg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const [t1, t2] = e.touches;
        pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchStartScale = scale;
      }
    }, { passive: true });
    lightboxImg.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = e.touches;
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        setScale(pinchStartScale * (dist / pinchStartDist));
      }
    }, { passive: false });

    document.querySelectorAll('.cs-main img').forEach(img => {
      if (img.closest('a') || img.classList.contains('cs-no-lightbox')) return;
      img.classList.add('cs-lightbox-trigger');
      img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt));
    });
  }
});
