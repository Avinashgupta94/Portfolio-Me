document.addEventListener('DOMContentLoaded', () => {
  const navToggleButton = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  const siteHeader = document.querySelector('.site-header');
  const navStyleToggle = document.getElementById('navStyleToggle');
  const themeToggle = document.getElementById('themeToggle');
  const navLinks = Array.from(document.querySelectorAll('.nav-list a'));
  const year = document.getElementById('year');
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const resumeMenuBtn = document.getElementById('resumeMenuBtn');
  const resumeMenu = document.getElementById('resumeMenu');
  const skillsTitle = document.querySelector('#about .skills-title');

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  if (navToggleButton && navList) {
    navToggleButton.addEventListener('click', () => {
      navList.classList.toggle('open');
    });
  }

  // Solid header on scroll
  const updateHeaderSolid = () => {
    if (!siteHeader) return;
    const isSolid = window.scrollY > 10 || (navStyleToggle && navStyleToggle.getAttribute('aria-pressed') === 'true');
    siteHeader.classList.toggle('is-solid', Boolean(isSolid));
  };
  updateHeaderSolid();
  window.addEventListener('scroll', updateHeaderSolid, { passive: true });

  // Manual toggle
  if (navStyleToggle) {
    navStyleToggle.addEventListener('click', () => {
      const pressed = navStyleToggle.getAttribute('aria-pressed') === 'true';
      navStyleToggle.setAttribute('aria-pressed', String(!pressed));
      updateHeaderSolid();
    });
  }

  // Resume dropdown interactions
  if (resumeMenuBtn && resumeMenu) {
    const closeMenu = () => {
      resumeMenu.classList.remove('open');
      resumeMenuBtn.setAttribute('aria-expanded', 'false');
    };
    const openMenu = () => {
      resumeMenu.classList.add('open');
      resumeMenuBtn.setAttribute('aria-expanded', 'true');
    };
    const toggleMenu = () => {
      const isOpen = resumeMenu.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    };
    resumeMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
    document.addEventListener('click', (e) => {
      if (!resumeMenu.contains(e.target) && e.target !== resumeMenuBtn) {
        closeMenu();
      }
    });
    // Keyboard accessibility
    resumeMenuBtn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
        const firstItem = resumeMenu.querySelector('.dropdown-item');
        if (firstItem) firstItem.focus();
      }
    });
    resumeMenu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu();
        resumeMenuBtn.focus();
      }
    });
  }

  // Theme toggle: light/dark with persistence
  const docEl = document.documentElement;
  const THEME_KEY = 'prefers-theme';
  const getStoredTheme = () => {
    try { return localStorage.getItem(THEME_KEY); } catch { return null; }
  };
  const setStoredTheme = (value) => {
    try { localStorage.setItem(THEME_KEY, value); } catch {}
  };
  const applyTheme = (mode) => {
    const isDark = mode === 'dark';
    docEl.classList.toggle('dark', isDark);
    if (themeToggle) themeToggle.textContent = isDark ? '🌙' : '☀️';
  };
  // Initialize from storage or system preference
  const initTheme = () => {
    const stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') {
      applyTheme(stored);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  };
  initTheme();
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      setStoredTheme(next);
    });
  }

  // Active link highlight on scroll
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const updateActiveLink = () => {
    let currentId = null;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) {
        currentId = '#' + section.id;
        break;
      }
    }
    for (const link of navLinks) {
      link.classList.toggle('active', link.getAttribute('href') === currentId);
    }
  };
  updateActiveLink();
  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // Simple animate-on-scroll for project cards
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.aos').forEach((el) => observer.observe(el));

  // Typing animation for hero subheading
  const typeTarget = document.getElementById('typeTarget');
  const words = ["Big Data", "SQL", "Python", "AWS Analytics", "Power BI"];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let lastTime = 0;

  const typeSpeed = 90;
  const deleteSpeed = 55;
  const holdTime = 900;

  const tick = (timestamp) => {
    if (!typeTarget) return;
    const dt = timestamp - lastTime;
    const currentWord = words[wordIndex];

    const interval = isDeleting ? deleteSpeed : typeSpeed;
    if (dt >= interval) {
      lastTime = timestamp;
      if (!isDeleting) {
        charIndex++;
        typeTarget.textContent = currentWord.slice(0, charIndex);
        if (charIndex === currentWord.length) {
          isDeleting = true;
          lastTime += holdTime; // pause at full word
        }
      } else {
        charIndex--;
        typeTarget.textContent = currentWord.slice(0, charIndex);
        if (charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
        }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Subtle interactive hover for Skills title sparkle
  if (skillsTitle) {
    const spark = skillsTitle.querySelector('.skills-spark');
    skillsTitle.addEventListener('mousemove', (e) => {
      if (!spark) return;
      const rect = skillsTitle.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      spark.style.transform = `translate(${x * 6}px, ${y * 6}px) rotate(${x * 10}deg)`;
    });
    skillsTitle.addEventListener('mouseleave', () => {
      if (!spark) return;
      spark.style.transform = '';
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(contactForm);
      const name = String(formData.get('name') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const phone = String(formData.get('phone') || '').trim();
      const subject = String(formData.get('subject') || '').trim();
      const message = String(formData.get('message') || '').trim();

      // Reset errors
      const fields = [
        { id: 'name', value: name, errorId: 'error-name', label: 'Name' },
        { id: 'email', value: email, errorId: 'error-email', label: 'Email' },
        { id: 'phone', value: phone, errorId: 'error-phone', label: 'Phone' },
        { id: 'subject', value: subject, errorId: 'error-subject', label: 'Subject' },
        { id: 'message', value: message, errorId: 'error-message', label: 'Message' },
      ];
      fields.forEach(({ id, errorId }) => {
        const input = document.getElementById(id);
        const error = document.getElementById(errorId);
        if (input) input.setAttribute('aria-invalid', 'false');
        if (error) error.textContent = '';
      });

      let hasError = false;
      for (const { id, value, errorId, label } of fields) {
        if (!value) {
          const input = document.getElementById(id);
          const error = document.getElementById(errorId);
          if (input) input.setAttribute('aria-invalid', 'true');
          if (error) error.textContent = `${label} is required.`;
          hasError = true;
        }
      }

      if (!hasError) {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailValid) {
          const input = document.getElementById('email');
          const error = document.getElementById('error-email');
          if (input) input.setAttribute('aria-invalid', 'true');
          if (error) error.textContent = 'Please enter a valid email address.';
          hasError = true;
        }
        if (phone && !/^\+?[0-9\-()\s]{7,20}$/.test(phone)) {
          const input = document.getElementById('phone');
          const error = document.getElementById('error-phone');
          if (input) input.setAttribute('aria-invalid', 'true');
          if (error) error.textContent = 'Please enter a valid phone number.';
          hasError = true;
        }
      }

      if (hasError) {
        if (formStatus) formStatus.textContent = 'Please correct the highlighted fields.';
        return;
      }

      // Submit to serverless endpoint instead of opening WhatsApp or SMS
      if (formStatus) formStatus.textContent = 'Sending…';
      const payload = {
        name,
        email,
        phone,
        message,
        subject,
        timestamp: new Date().toISOString()
      };
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({ success:false, message:'Invalid response' }));
        if (res.ok && data.success) {
          if (formStatus) formStatus.textContent = '✅ Message sent successfully. I’ll reply shortly.';
          contactForm.reset();
        } else {
          if (formStatus) formStatus.textContent = data.message || 'Something went wrong. Please try again later.';
        }
      } catch (e) {
        if (formStatus) formStatus.textContent = 'Network error. Please try again later.';
      }
    });
  }
});


