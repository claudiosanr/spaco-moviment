const WHATSAPP_NUMBER = "5561991581707";

// Bloqueia cópia de texto, clique-direito, arrastar imagem e zoom (pinça/duplo toque)
document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("copy", (e) => e.preventDefault());
document.addEventListener("selectstart", (e) => e.preventDefault());
document.addEventListener("dragstart", (e) => e.preventDefault());
document.addEventListener("gesturestart", (e) => e.preventDefault());

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false }
);

// Intro splash: logo gira na abertura, depois some
(function initIntroSplash() {
  const splash = document.getElementById("intro-splash");
  const skipBtn = document.getElementById("intro-skip");

  if (sessionStorage.getItem("introSeen")) {
    splash.remove();
    return;
  }

  document.body.style.overflow = "hidden";
  let hasHidden = false;

  function hide() {
    if (hasHidden) return;
    hasHidden = true;

    splash.classList.add("is-hidden");
    document.body.style.overflow = "";
    sessionStorage.setItem("introSeen", "1");
    window.setTimeout(() => splash.remove(), 500);
  }

  skipBtn.addEventListener("click", hide);
  window.setTimeout(hide, 2200);
})();

function buildWhatsAppLink(message) {
  const base = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}`
    : `https://wa.me/`;
  return `${base}?text=${encodeURIComponent(message)}`;
}

// Mobile nav toggle
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");

navToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mainNav.classList.remove("is-open"));
});

// Default WhatsApp CTA (footer/contact) with a generic opening message
const contactWhatsApp = document.getElementById("contact-whatsapp");
contactWhatsApp.href = buildWhatsAppLink(
  "Olá! Vim pelo site da Spaço Moviment e gostaria de marcar uma avaliação."
);

// Pré-atendimento quiz
const quizCard = document.getElementById("quiz-card");
const steps = quizCard.querySelectorAll(".quiz-step");
const resultPanel = quizCard.querySelector(".quiz-result");
const resultText = document.getElementById("quiz-result-text");
const quizCta = document.getElementById("quiz-cta");
const quizRestart = document.getElementById("quiz-restart");

const answers = {};

function goToStep(stepNumber) {
  steps.forEach((step) => {
    step.classList.toggle("is-active", step.dataset.step === String(stepNumber));
  });
  resultPanel.classList.remove("is-active");
}

function showResult() {
  steps.forEach((step) => step.classList.remove("is-active"));

  const message =
    `Olá! Fiz a pré-avaliação no site da Spaço Moviment.\n` +
    `Situação: ${answers.situacao}.\n` +
    `Tempo: ${answers.tempo}.\n` +
    `Gostaria de marcar minha avaliação.`;

  resultText.textContent =
    `Com base no que você respondeu (${answers.situacao}, ${answers.tempo}), ` +
    `o próximo passo é uma avaliação presencial pra montar seu plano de ` +
    `tratamento individualizado. Clique abaixo pra enviar suas respostas ` +
    `direto pro WhatsApp e já marcar seu horário.`;

  quizCta.href = buildWhatsAppLink(message);
  resultPanel.classList.add("is-active");
}

quizCard.addEventListener("click", (event) => {
  const option = event.target.closest(".quiz-option");
  if (!option) return;

  const stepEl = option.closest(".quiz-step");
  const stepNumber = stepEl.dataset.step;

  if (stepNumber === "1") {
    answers.situacao = option.dataset.value;
    goToStep(2);
  } else if (stepNumber === "2") {
    answers.tempo = option.dataset.value;
    showResult();
  }
});

quizRestart.addEventListener("click", () => {
  goToStep(1);
});

// Sticky header shrink
const header = document.getElementById("site-header");
window.addEventListener("scroll", () => {
  header.style.background = window.scrollY > 40
    ? "rgba(20, 24, 26, 0.92)"
    : "rgba(20, 24, 26, 0.75)";
});

// Reveal on scroll
const revealTargets = document.querySelectorAll(
  ".service-card, .diff-item, .gallery-item, .testimonial-card, .about-photo, .quiz-card"
);
revealTargets.forEach((el) => el.setAttribute("data-reveal", ""));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealTargets.forEach((el) => observer.observe(el));
