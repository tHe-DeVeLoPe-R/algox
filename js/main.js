// Handle Preloader
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    // Ensure animation plays for at least 2.5s even if load is fast
    const minTime = 2500; 
    const timeElapsed = performance.now();
    const delay = Math.max(0, minTime - timeElapsed);
    
    setTimeout(() => {
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 600); // Wait for CSS transition (0.6s) to finish
    }, delay);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Projects data
  initProjects();

  // 2. Setup VVIP Modal
  setupVvipModal();

  // 3. Setup Scroll Animations
  setupScrollAnimations();

  // 4. Setup Contact Redirects
  setupContactForm();

  // 5. Setup Navbar Auto Close
  setupNavbarAutoClose();

  // 6. Setup Domains Slider
  setupDomainsSlider();

  // 7. Setup Stats Animation
  setupStatsAnimation();
});

/**
 * Initialize project fetching and rendering.
 * Synchronizes with localStorage to show real-time admin updates.
 */
function initProjects() {
  const gridContainer = document.getElementById('projects-grid');
  if (!gridContainer) return;

  const localProjects = localStorage.getItem('algox_projects');

  if (localProjects) {
    renderProjects(JSON.parse(localProjects));
  } else {
    // Fetch from projects.json file on first run
    fetch('projects.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        localStorage.setItem('algox_projects', JSON.stringify(data));
        renderProjects(data);
      })
      .catch(error => {
        console.error('Error fetching seed projects:', error);
        gridContainer.innerHTML = `
          <div class="col-12 text-center py-5">
            <p class="text-danger">Failed to load projects. Please refresh the page.</p>
          </div>
        `;
      });
  }
}

/**
 * Render project array to the HTML grid container
 */
function renderProjects(projects) {
  const gridContainer = document.getElementById('projects-grid');
  if (!gridContainer) return;

  if (projects.length === 0) {
    gridContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <p class="text-muted">No projects found. Visit the Management Controls page to add your first project.</p>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = '';

  projects.forEach((proj, idx) => {
    // Generate a card with full non-cropped image handling
    const cardHtml = `
      <div class="col-md-6 col-lg-4 mb-4 scroll-fold">
        <div class="project-card">
          <div class="project-img-container">
            <img src="${proj.image}" alt="${proj.title} Showcase" onerror="this.src='https://placehold.co/600x400/0b0f19/f3f4f6?text=${encodeURIComponent(proj.title)}'">
          </div>
          <div class="project-body">
            <span class="project-badge">${escapeHtml(proj.domain)}</span>
            <h4 class="project-title">${escapeHtml(proj.title)}</h4>
            <p class="project-description text-muted">${escapeHtml(proj.description)}</p>
          </div>
        </div>
      </div>
    `;
    gridContainer.insertAdjacentHTML('beforeend', cardHtml);
  });

  // Re-trigger scroll observer on new elements
  setupScrollAnimations();
}

/**
 * Setup VVIP modal dropdown after 1.5 seconds delay.
 * Uses sessionStorage to prevent spamming the user on every reload during a single session.
 */
function setupVvipModal() {
  const overlay = document.getElementById('vvip-modal');
  const closeBtn = document.getElementById('vvip-modal-close');
  const actionBtn = document.getElementById('vvip-modal-action');

  if (!overlay || !closeBtn) return;

  // Check if shown in this session
  if (sessionStorage.getItem('vvip_modal_shown') === 'true') {
    return;
  }

  setTimeout(() => {
    overlay.classList.add('show');
    sessionStorage.setItem('vvip_modal_shown', 'true');
  }, 1500);

  // Close modal logic
  const closeModal = () => {
    overlay.classList.remove('show');
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      closeModal();
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/**
 * Setup IntersectionObserver for smooth scroll fade-in animations
 */
function setupScrollAnimations() {
  const animatedElements = document.querySelectorAll('.scroll-anim, .scroll-fold, .scroll-splash');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target); // Animates once
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  } else {
    // Fallback if browser doesn't support IntersectionObserver
    animatedElements.forEach(el => el.classList.add('active'));
  }
}

/**
 * Setup contact form actions for email and WhatsApp redirects
 */
function setupContactForm() {
  const form = document.getElementById('contact-form');
  const btnWa = document.getElementById('send-whatsapp');
  const btnEmail = document.getElementById('send-email');

  if (!form) return;

  // Dummy target details - client will edit
  const WHATSAPP_NUMBER = "923001234567"; // Prefixed with country code, no "+" or leading zeros
  const EMAIL_ADDRESS = "info@algoxdigital.com";

  function getFormData() {
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !subject || !message) {
      alert("Please fill in all form fields to contact us.");
      return null;
    }

    return { name, email, subject, message };
  }

  if (btnWa) {
    btnWa.addEventListener('click', (e) => {
      e.preventDefault();
      const data = getFormData();
      if (!data) return;

      const formattedText = `Hello AlgoXDigital,\n\nMy name is *${data.name}* (${data.email}).\n\n*Subject:* ${data.subject}\n\n*Message:* ${data.message}`;
      const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(formattedText)}`;
      window.open(waUrl, '_blank');
    });
  }

  if (btnEmail) {
    btnEmail.addEventListener('click', (e) => {
      e.preventDefault();
      const data = getFormData();
      if (!data) return;

      const mailtoUrl = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent("Name: " + data.name + "\nEmail: " + data.email + "\n\nMessage:\n" + data.message)}`;
      window.location.href = mailtoUrl;
    });
  }
}

/**
 * Escape HTML to prevent XSS injection from dynamic inputs
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Setup auto-closing of responsive navigation menu.
 * Closes collapse when a link is clicked, or when clicking outside the navbar.
 */
function setupNavbarAutoClose() {
  const navbarCollapse = document.getElementById('navbarContent');
  const navbar = document.getElementById('main-nav');
  if (!navbarCollapse || !navbar) return;

  // Bootstrap 5 Collapse instance
  const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navbarCollapse, { toggle: false });

  // Close menu when nav link (excluding dropdown toggles) or dropdown item is clicked
  const navLinks = navbarCollapse.querySelectorAll('.nav-link:not(.dropdown-toggle), .dropdown-item');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navbarCollapse.classList.contains('show')) {
        bsCollapse.hide();
      }
    });
  });

  // Close menu when clicking anywhere outside navbar
  document.addEventListener('click', (event) => {
    const isClickedInsideNavbar = navbar.contains(event.target);
    const isMenuOpen = navbarCollapse.classList.contains('show');
    
    if (isMenuOpen && !isClickedInsideNavbar) {
      bsCollapse.hide();
    }
  });
}

/**
 * Setup custom premium slider for working domains
 */
function setupDomainsSlider() {
  const track = document.getElementById('domains-track');
  const prevBtn = document.getElementById('domains-prev');
  const nextBtn = document.getElementById('domains-next');
  const dotsContainer = document.getElementById('domains-dots');

  if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

  const cards = track.querySelectorAll('.domain-card-wrapper');
  if (cards.length === 0) return;

  let currentIndex = 0;
  let cardsToShow = getCardsToShow();

  // Initialize dots
  createDots();
  updateSliderState();

  // Listeners
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      slide();
    }
  });

  nextBtn.addEventListener('click', () => {
    const maxIndex = cards.length - cardsToShow;
    if (currentIndex < maxIndex) {
      currentIndex++;
      slide();
    }
  });

  // Handle window resizing
  window.addEventListener('resize', () => {
    const prevCardsToShow = cardsToShow;
    cardsToShow = getCardsToShow();
    if (prevCardsToShow !== cardsToShow) {
      // Re-create dots if structure shifts
      currentIndex = Math.min(currentIndex, cards.length - cardsToShow);
      if (currentIndex < 0) currentIndex = 0;
      createDots();
      slide();
    } else {
      slide(); // Recalculate slide offset smoothly on continuous scale
    }
  });

  // Auto-scroll logic
  let autoScrollTimer = null;

  function startAutoScroll() {
    autoScrollTimer = setInterval(() => {
      const maxIndex = cards.length - cardsToShow;
      if (currentIndex < maxIndex) {
        currentIndex++;
      } else {
        currentIndex = 0;
      }
      slide();
    }, 2500);
  }

  function stopAutoScroll() {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
  }

  startAutoScroll();

  track.addEventListener('mouseenter', stopAutoScroll);
  track.addEventListener('mouseleave', startAutoScroll);
  track.addEventListener('touchstart', stopAutoScroll, { passive: true });
  track.addEventListener('touchend', startAutoScroll, { passive: true });

  // Touch Support for Mobile Swiping
  let startX = 0;
  let isSwiping = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    const diffX = e.touches[0].clientX - startX;
    
    // Swipe left (next)
    if (diffX < -50) {
      const maxIndex = cards.length - cardsToShow;
      if (currentIndex < maxIndex) {
        currentIndex++;
        slide();
      }
      isSwiping = false;
    }
    // Swipe right (prev)
    else if (diffX > 50) {
      if (currentIndex > 0) {
        currentIndex--;
        slide();
      }
      isSwiping = false;
    }
  }, { passive: true });

  track.addEventListener('touchend', () => {
    isSwiping = false;
  });

  function getCardsToShow() {
    const width = window.innerWidth;
    if (width >= 992) return 3;  // Desktop
    if (width >= 576) return 2;  // Tablet
    return 1;                   // Mobile
  }

  function createDots() {
    dotsContainer.innerHTML = '';
    const maxDots = cards.length - cardsToShow + 1;
    if (maxDots <= 1) return; // Hide dots if only 1 page
    
    for (let i = 0; i < maxDots; i++) {
      const dot = document.createElement('div');
      dot.className = `slider-dot ${i === currentIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        currentIndex = i;
        slide();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function slide() {
    // Calculate translate offset based on current card width + gap
    const gap = window.innerWidth <= 576 ? 16 : 24; // 1rem (16px) or 1.5rem (24px) gap
    const cardWidth = cards[0].getBoundingClientRect().width;
    const offset = currentIndex * (cardWidth + gap);
    
    track.style.transform = `translateX(-${offset}px)`;
    updateSliderState();
  }

  function updateSliderState() {
    const maxIndex = cards.length - cardsToShow;
    
    // Toggle button disables
    prevBtn.classList.toggle('disabled', currentIndex === 0);
    nextBtn.classList.toggle('disabled', currentIndex >= maxIndex || maxIndex < 0);

    // Update dots active class
    const dots = dotsContainer.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }
}

/**
 * Setup Stats Counter Animation
 */
function setupStatsAnimation() {
  const stats = document.querySelectorAll('.hero-stat-number');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    stats.forEach(stat => observer.observe(stat));
  } else {
    stats.forEach(stat => animateCounter(stat));
  }
}

function animateCounter(el) {
  const targetText = el.innerText;
  const targetNum = parseInt(targetText.replace(/\D/g, ''));
  const suffix = targetText.replace(/[0-9]/g, '');
  
  if (isNaN(targetNum)) return;
  
  let currentNum = 0;
  const duration = 2000; // ms
  
  const timer = setInterval(() => {
    currentNum += Math.ceil(targetNum / 50); // Increment
    if (currentNum >= targetNum) {
      currentNum = targetNum;
      clearInterval(timer);
    }
    el.innerText = currentNum + suffix;
  }, 40); // roughly 50 steps
}
