(function () {
  const body = document.body;
  const html = document.documentElement;

  const langButtons = document.querySelectorAll(".lang-btn");
  const translatableElements = document.querySelectorAll("[data-fr], [data-en]");
  const placeholderElements = document.querySelectorAll(
    "[data-fr-placeholder], [data-en-placeholder]"
  );

  /* ---------------------------- */
  /* Language switch              */
  /* ---------------------------- */

  function setLanguage(lang) {
    localStorage.setItem("vortech-lang", lang);
    html.lang = lang;

    translatableElements.forEach(function (element) {
      const value = element.dataset[lang] || element.dataset.fr || element.textContent;
      element.innerHTML = value;
    });

    placeholderElements.forEach(function (element) {
      const placeholderKey = lang + "Placeholder";
      const value = element.dataset[placeholderKey] || element.dataset.frPlaceholder || "";

      if (value) {
        element.placeholder = value;
      }
    });

    langButtons.forEach(function (button) {
      button.classList.toggle("active", button.dataset.lang === lang);
    });

    const titleKey = lang + "Title";
    const pageTitle = body.dataset[titleKey];

    if (pageTitle) {
      document.title = pageTitle;
    }
  }

  function detectLanguage() {
    const savedLanguage = localStorage.getItem("vortech-lang");

    if (savedLanguage === "fr" || savedLanguage === "en") {
      return savedLanguage;
    }

    /*
      For now, French is the default language.

      Later, we can improve this with IP geolocation:
      - Africa => French default
      - Outside Africa => English default
    */

    return "fr";
  }

  setLanguage(detectLanguage());

  langButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setLanguage(button.dataset.lang);
    });
  });

  /* ---------------------------- */
  /* Mobile navigation            */
  /* ---------------------------- */

  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      const isOpen = body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------- */
  /* Hero slider                  */
  /* ---------------------------- */

  const heroSlider = document.getElementById("heroSlider");

  if (heroSlider) {
    const slides = Array.from(heroSlider.querySelectorAll(".hero-slide"));
    const dots = Array.from(heroSlider.querySelectorAll(".hero-dot"));

    let currentSlide = 0;
    let sliderInterval = null;

    function showSlide(index) {
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });

      currentSlide = index;
    }

    function nextSlide() {
      const next = (currentSlide + 1) % slides.length;
      showSlide(next);
    }

    function startSlider() {
      if (slides.length > 1) {
        sliderInterval = setInterval(nextSlide, 5000);
      }
    }

    function stopSlider() {
      clearInterval(sliderInterval);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        showSlide(index);
        stopSlider();
        startSlider();
      });
    });

    heroSlider.addEventListener("mouseenter", stopSlider);
    heroSlider.addEventListener("mouseleave", startSlider);

    showSlide(0);
    startSlider();
  }

  /* ---------------------------- */
  /* Promo modal                  */
  /* ---------------------------- */

  const promoFloat = document.getElementById("promoFloat");
  const promoModal = document.getElementById("promoModal");

  function openPromoModal() {
    if (!promoModal) {
      return;
    }

    promoModal.hidden = false;
    body.classList.add("no-scroll");
  }

  function closePromoModal() {
    if (!promoModal) {
      return;
    }

    promoModal.hidden = true;
    body.classList.remove("no-scroll");
  }

  if (promoFloat) {
    promoFloat.addEventListener("click", openPromoModal);
  }

  document.querySelectorAll("[data-close-promo]").forEach(function (element) {
    element.addEventListener("click", function (event) {
      if (element.tagName !== "A") {
        event.preventDefault();
      }

      closePromoModal();
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && promoModal && !promoModal.hidden) {
      closePromoModal();
    }
  });

  /* ---------------------------- */
  /* FAQ accordion                */
  /* ---------------------------- */

  const accordionItems = document.querySelectorAll(".accordion-item");

  accordionItems.forEach(function (item) {
    const trigger = item.querySelector(".accordion-trigger");

    if (!trigger) {
      return;
    }

    trigger.addEventListener("click", function () {
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";

      accordionItems.forEach(function (otherItem) {
        otherItem.classList.remove("active");

        const otherTrigger = otherItem.querySelector(".accordion-trigger");

        if (otherTrigger) {
          otherTrigger.setAttribute("aria-expanded", "false");
        }
      });

      item.classList.add("active");
      trigger.setAttribute("aria-expanded", String(!isExpanded));
    });
  });

  /* ---------------------------- */
  /* Contact form                 */
  /* ---------------------------- */

  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const currentLanguage = localStorage.getItem("vortech-lang") || "fr";

      if (formStatus) {
        formStatus.textContent =
          currentLanguage === "en"
            ? "Thank you. Your request has been prepared. Connect this form to your email, WhatsApp or backend service."
            : "Merci. Votre demande est prête. Connectez ce formulaire à votre service e-mail, WhatsApp ou backend.";
      }

      contactForm.reset();
    });
  }
})();