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
  /* ---------------------------- */
  /* Contact form (Formspree)     */
  /* ---------------------------- */

  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");

  if (contactForm) {
    contactForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const currentLanguage = localStorage.getItem("vortech-lang") || "fr";
      const submitButton = contactForm.querySelector('button[type="submit"]');
      
      // 1. Show loading state
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = currentLanguage === "en" ? "Sending..." : "Envoi en cours...";
      }
      if (formStatus) formStatus.textContent = "";

      try {
        // 2. Send data to Formspree
        const response = await fetch(contactForm.action, {
          method: contactForm.method,
          body: new FormData(contactForm),
          headers: {
            'Accept': 'application/json'
          }
        });

        // 3. Handle Success
        if (response.ok) {
          if (formStatus) {
            formStatus.style.color = "var(--green-dark)";
            formStatus.textContent = currentLanguage === "en"
              ? "Thank you! Your message has been sent successfully. We will contact you soon."
              : "Merci ! Votre message a été envoyé avec succès. Nous vous contacterons très bientôt.";
          }
          contactForm.reset();
        } 
        // 4. Handle Formspree Errors
        else {
          if (formStatus) {
            formStatus.style.color = "#d93025"; // Red
            formStatus.textContent = currentLanguage === "en"
              ? "Oops! There was a problem submitting your form. Please try again or contact us via WhatsApp."
              : "Oups ! Un problème est survenu. Veuillez réessayer ou nous contacter via WhatsApp.";
          }
        }
      } 
      // 5. Handle Network Errors
      catch (error) {
        if (formStatus) {
          formStatus.style.color = "#d93025"; // Red
          formStatus.textContent = currentLanguage === "en"
            ? "Network error. Please check your connection."
            : "Erreur réseau. Vérifiez votre connexion.";
        }
      } 
      // 6. Reset button state
      finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = currentLanguage === "en" ? "Send my request" : "Envoyer ma demande";
        }
      }
    });
  }
})();
