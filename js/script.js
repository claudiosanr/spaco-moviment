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

function buildWhatsAppLink(message) {
  const base = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}`
    : `https://wa.me/`;
  return `${base}?text=${encodeURIComponent(message)}`;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Modo leve: tela pequena, ponteiro touch ou preferência por menos animação usam a
// versão sem scroll-jacking (mais fluida em hardware mais fraco / celular)
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmallViewport = window.matchMedia("(max-width: 760px)").matches;
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
const flatMode = prefersReducedMotion || isSmallViewport || isCoarsePointer;
if (flatMode) document.documentElement.classList.add("flat-scroll");

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

// Header muda de estado ao rolar (listener leve e passivo, não depende do loop pesado)
const header = document.getElementById("site-header");
let headerTicking = false;
function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 40);
  headerTicking = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!headerTicking) {
      headerTicking = true;
      requestAnimationFrame(updateHeader);
    }
  },
  { passive: true }
);
updateHeader();

// WhatsApp CTA (contato)
const contactWhatsApp = document.getElementById("contact-whatsapp");
contactWhatsApp.href = buildWhatsAppLink(
  "Olá! Vim pelo site da Spaço Moviment e gostaria de marcar uma avaliação."
);

// Formulário de contato: coleta nome/telefone e encaminha pro WhatsApp (site estático, sem backend)
const contactForm = document.getElementById("contact-form");
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nome = document.getElementById("input-nome").value.trim();
  const telefone = document.getElementById("input-telefone").value.trim();
  if (!nome || !telefone) return;

  const message =
    `Olá! Me chamo ${nome} e vim pelo site da Spaço Moviment.\n` +
    `Meu telefone: ${telefone}.\n` +
    `Gostaria de marcar minha avaliação.`;

  window.open(buildWhatsAppLink(message), "_blank", "noopener");
});

const heroSection = document.querySelector(".cinematic-hero");
const heroVideo = document.getElementById("hero-video");

if (flatMode) {
  // Modo leve: vídeo toca em loop simples, sem scrub por scroll (seek constante é
  // a maior causa de travamento em aparelhos mais fracos)
  heroVideo.loop = true;
  heroVideo.muted = true;
  heroVideo.setAttribute("playsinline", "");
  heroVideo.play().catch(() => {});

  // Reaproveita o observer de revelação genérico pras seções que eram pinadas
  document
    .querySelectorAll(".philosophy-line, .pillar-card")
    .forEach((el) => el.setAttribute("data-reveal", ""));
} else {
  // Smooth scroll (Lenis)
  let lenis = null;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  }

  // Cada seção pinada só calcula scroll/seek quando está perto da tela, em vez de
  // rodar getBoundingClientRect toda hora pra seções que nem aparecem ainda
  function observeInView(el, onChange) {
    if (!el) return () => true;
    let inView = true;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => (inView = entry.isIntersecting)),
      { rootMargin: "25% 0px 25% 0px" }
    );
    io.observe(el);
    return () => inView;
  }

  const heroInView = observeInView(heroSection);

  function updateHeroScrub() {
    const duration = heroVideo.duration;
    if (!duration || Number.isNaN(duration) || heroVideo.readyState < 1) return;
    const rect = heroSection.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return;
    const progress = clamp(-rect.top / scrollable, 0, 1);
    const targetTime = progress * duration;
    if (Math.abs(heroVideo.currentTime - targetTime) > 0.02) {
      if (typeof heroVideo.fastSeek === "function") {
        heroVideo.fastSeek(targetTime);
      } else {
        heroVideo.currentTime = targetTime;
      }
    }
  }

  // Sequência pinada genérica: opacidade calculada direto do progresso do scroll
  // (não por classe + transição CSS), pra o crossfade acompanhar exatamente a
  // velocidade real do scroll. Cada linha tem uma janela centrada no meio do seu
  // passo, com uma sobreposição mínima com as vizinhas (senão dá um "flash" em
  // branco bem no instante exato da troca, quando as duas ficam em opacidade 0).
  // O deslocamento vertical é direcional (quem ainda não chegou sobe de baixo,
  // quem já passou sai por cima), pra separar as duas fisicamente durante a
  // troca e não deixar frases de tamanhos diferentes se misturarem no meio.
  // Usada tanto pelas seções de filosofia (podem existir várias) quanto pelos pilares.
  const FADE_WIDTH = 0.06;
  const HALF_WINDOW = 0.505;
  const PLATEAU = HALF_WINDOW - FADE_WIDTH;
  const TRANSLATE_PX = 70;

  function createPinnedSequence(section, stepSelector) {
    const steps = Array.from(section.querySelectorAll(stepSelector));
    if (!steps.length) return null;
    const isInView = observeInView(section);

    return function update() {
      if (!isInView()) return;
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = clamp(scrollable > 0 ? -rect.top / scrollable : 0, 0, 1);
      const stepProgress = progress * steps.length;
      const activeIndex = Math.min(steps.length - 1, Math.floor(stepProgress));

      steps.forEach((el, i) => {
        const signedDist = stepProgress - (i + 0.5);
        const opacity = clamp(1 - (Math.abs(signedDist) - PLATEAU) / FADE_WIDTH, 0, 1);
        el.style.opacity = opacity;
        el.style.transform = `translateY(${-signedDist * TRANSLATE_PX}px)`;
        el.classList.toggle("is-active", i === activeIndex);
      });
    };
  }

  const pinnedUpdaters = [];
  document.querySelectorAll(".philosophy").forEach((section) => {
    const update = createPinnedSequence(section, ".philosophy-line");
    if (update) pinnedUpdaters.push(update);
  });
  document.querySelectorAll(".pillars").forEach((section) => {
    const update = createPinnedSequence(section, ".pillar-card");
    if (update) pinnedUpdaters.push(update);
  });

  function updateAll() {
    if (heroInView()) updateHeroScrub();
    pinnedUpdaters.forEach((update) => update());
  }

  function raf(time) {
    if (lenis) lenis.raf(time);
    updateAll();
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// Reveal on scroll (elementos não pinados: dores, depoimentos, e tudo marcado no modo leve)
const revealTargets = document.querySelectorAll("[data-reveal]");
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
