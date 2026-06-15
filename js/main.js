const {
    previewData = {},
    gamePreviews = {},
    projects = {},
    games = {}
} = window.portfolioData || {};

const cursor = document.getElementById("cur");
const cursorRing = document.getElementById("cur2");
const revealElements = document.querySelectorAll(".reveal, .stagger");
const previewPopup = document.getElementById("site-preview");
const previewScreen = document.getElementById("preview-screen");
const previewUrl = document.getElementById("preview-url");
const previewName = document.getElementById("preview-name");
const PREVIEW_POPUP_WIDTH = 320;
const PREVIEW_POPUP_HEIGHT = 280;
const PREVIEW_POPUP_PADDING = 20;
const overlay = document.getElementById("proj-overlay");
const closeOverlayButton = document.getElementById("close-overlay-btn");
const imageFocusOverlay = document.getElementById("image-focus-overlay");
const imageFocusImage = document.getElementById("image-focus-image");
const imageFocusCaption = document.getElementById("image-focus-caption");
const imageFocusCloseButton = document.getElementById("image-focus-close");
const overlayFields = {
    num: document.getElementById("po-num"),
    eyebrow: document.getElementById("po-eyebrow"),
    title: document.getElementById("po-title"),
    ghost: document.getElementById("po-ghost"),
    client: document.getElementById("po-client"),
    year: document.getElementById("po-year"),
    type: document.getElementById("po-type"),
    desc: document.getElementById("po-desc"),
    role: document.getElementById("po-role"),
    hero: document.getElementById("po-hero-mock"),
    stack: document.getElementById("po-stack"),
    screens: document.getElementById("po-screens"),
    preview: document.getElementById("po-preview"),
    previewDivider: document.getElementById("po-preview-divider")
};
const webDeckCopy = document.getElementById("webdeck-copy");
const webDeckCounter = document.getElementById("webdeck-counter");
const webDeckStage = document.getElementById("webdeck-stage");
const webDeckControls = Array.from(document.querySelectorAll("[data-webdeck-dir]"));

let mouseX = 0;
let mouseY = 0;
let ringX = 0;
let ringY = 0;
let hidePreviewTimer;
let webDeckOrder = [];
let webDeckCards = [];
let webDeckActiveIndex = 0;
let webDeckIntervalId = null;
let webDeckTimeline = null;
let webDeckAnimating = false;
let webDeckQueuedDirection = 0;
let isOverlayOpen = false;
let isImageFocusOpen = false;

const webDeckItems = getWebsiteDeckItems();
const webDeckTiltStates = new WeakMap();
const WEBDECK_CARD_DISTANCE = 72;
const WEBDECK_VERTICAL_DISTANCE = 78;
const WEBDECK_DELAY = 4200;
const WEBDECK_TILT = {
    rotateAmplitude: 12,
    hoverScale: 1.045
};
const WEBDECK_MOTION = {
    ease: "power3.out",
    durDrop: 0.8,
    durMove: 0.9,
    durReturn: 0.85,
    promoteOverlap: 0.78,
    returnDelay: 0.04,
    speedMultiplier: 5
};

function getEntry(key) {
    return projects[key] || games[key];
}

function getPreview(key) {
    return previewData[key] || gamePreviews[key];
}

function escapeAttribute(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function stripHtml(html = "") {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return (temp.textContent || temp.innerText || "")
        .replace(/\s+/g, " ")
        .trim();
}

function summarizeHtml(html = "") {
    const text = stripHtml(html);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const summary = (sentences.slice(0, 2).join(" ").trim() || text).trim();
    return summary.length > 240 ? `${summary.slice(0, 237).trim()}...` : summary;
}

function getWebsiteDeckItems() {
    return Object.entries(projects)
        .sort(([, a], [, b]) => String(a.num).localeCompare(String(b.num), undefined, { numeric: true }))
        .map(([key, entry]) => {
            const preview = getPreview(key);
            const image = entry.screens?.[0]?.image || preview?.screenshotUrl || "";

            return {
                key,
                title: preview?.name || entry.client,
                category: entry.type,
                url: entry.liveUrl || preview?.url || "",
                image,
                year: entry.year,
                desc: summarizeHtml(entry.desc),
                tags: (entry.stack || []).slice(0, 3)
            };
        })
        .filter((item) => item.image);
}

function renderImageTag(src, alt, className, extraAttributes = "") {
    return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" class="${escapeAttribute(className)}" decoding="async"${extraAttributes ? ` ${extraAttributes}` : ""}>`;
}

function renderFocusableOverlayImage(src, alt, wrapperClass, imageClass, extraAttributes = "") {
    return `
        <button class="${wrapperClass}" type="button" data-focus-src="${escapeAttribute(src)}" data-focus-alt="${escapeAttribute(alt)}">
            ${renderImageTag(src, alt, imageClass, extraAttributes)}
        </button>
    `;
}

function renderPreviewMedia(data, imageClassName) {
    if (!data) {
        return "";
    }

    if (data.screenshotUrl) {
        return renderImageTag(data.screenshotUrl, data.name, imageClassName, 'fetchpriority="low"');
    }

    return data.html || "";
}

function initCursor() {
    if (!window.matchMedia("(pointer: fine)").matches || !cursor || !cursorRing) {
        return;
    }

    document.addEventListener("mousemove", (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    const animateCursor = () => {
        ringX += (mouseX - ringX) * 0.1;
        ringY += (mouseY - ringY) * 0.1;
        cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        window.requestAnimationFrame(animateCursor);
    };

    animateCursor();
}

function initRevealAnimations() {
    if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !("IntersectionObserver" in window)
    ) {
        revealElements.forEach((element) => element.classList.add("v"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("v");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px"
    });

    revealElements.forEach((element) => observer.observe(element));
}

function initScrollMotion() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const deckTargets = Array.from(document.querySelectorAll(".webdeck-card-tilt"));
    const panelTargets = Array.from(document.querySelectorAll(".gc, .ci"));
    const ghostTargets = Array.from(document.querySelectorAll(".ghost-bg, .section-ghost, .gc-ghost-n"));

    if (!deckTargets.length && !panelTargets.length && !ghostTargets.length) {
        return;
    }

    let isTicking = false;

    function applyMotion() {
        isTicking = false;
        const viewportHeight = window.innerHeight || 1;

        deckTargets.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
            const progress = Math.max(-1, Math.min(1, centerOffset / viewportHeight));
            const direction = index % 2 === 0 ? 1 : -1;

            element.style.setProperty("--scroll-lift", `${progress * -14}px`);
            element.style.setProperty("--scroll-roll", `${progress * 1.8 * direction}deg`);
        });

        panelTargets.forEach((element) => {
            const rect = element.getBoundingClientRect();
            const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
            const progress = Math.max(-1, Math.min(1, centerOffset / viewportHeight));
            element.style.setProperty("--scroll-lift", `${progress * -16}px`);
        });

        ghostTargets.forEach((element) => {
            const rect = element.getBoundingClientRect();
            const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
            const progress = Math.max(-1, Math.min(1, centerOffset / viewportHeight));
            element.style.setProperty("--ghost-scroll", `${progress * -34}px`);
        });
    }

    function queueMotion() {
        if (isTicking) {
            return;
        }

        isTicking = true;
        window.requestAnimationFrame(applyMotion);
    }

    window.addEventListener("scroll", queueMotion, { passive: true });
    window.addEventListener("resize", queueMotion, { passive: true });
    queueMotion();
}

function positionPreview(event) {
    if (!previewPopup) {
        return;
    }

    let left = event.clientX + PREVIEW_POPUP_PADDING;
    let top = event.clientY - PREVIEW_POPUP_HEIGHT / 2;

    if (left + PREVIEW_POPUP_WIDTH > window.innerWidth) {
        left = event.clientX - PREVIEW_POPUP_WIDTH - PREVIEW_POPUP_PADDING;
    }

    if (top < 8) {
        top = 8;
    }

    if (top + PREVIEW_POPUP_HEIGHT > window.innerHeight - 8) {
        top = window.innerHeight - PREVIEW_POPUP_HEIGHT - 8;
    }

    previewPopup.style.left = `${left}px`;
    previewPopup.style.top = `${top}px`;
}

function showPreview(data, event) {
    if (!data || !previewPopup || !previewScreen || !previewUrl || !previewName) {
        return;
    }

    window.clearTimeout(hidePreviewTimer);
    previewScreen.innerHTML = renderPreviewMedia(data, "preview-image");
    previewUrl.textContent = data.url;
    previewName.textContent = data.name;
    previewPopup.classList.add("visible");
    positionPreview(event);
}

function hidePreview() {
    if (!previewPopup) {
        return;
    }

    hidePreviewTimer = window.setTimeout(() => {
        previewPopup.classList.remove("visible");
    }, 120);
}

function renderOverlayPreview(key) {
    const data = getPreview(key);
    const entry = getEntry(key);

    if (!data || !entry) {
        return "";
    }

    const media = renderPreviewMedia(data, "po-preview-image");
    if (!media) {
        return "";
    }

    if (entry.liveUrl) {
        return `
            <a href="${entry.liveUrl}" class="po-preview-link" target="_blank" rel="noreferrer" aria-label="Open ${data.name} live site">
                <div class="po-preview-card">
                    <div class="po-preview-media">${media}</div>
                    <div class="po-preview-caption">
                        <span>${data.name}</span>
                        <span class="po-preview-icon" aria-hidden="true">\u2197</span>
                    </div>
                </div>
            </a>
        `;
    }

    return `
        <div class="po-preview-card">
            <div class="po-preview-media">${media}</div>
            <div class="po-preview-caption">${data.name}</div>
        </div>
    `;
}

function renderProjectScreens(screens = []) {
    return screens
        .map((screen) => {
            if (screen.image) {
                return `
                    <button class="po-screen po-screen-focus" type="button" data-focus-src="${escapeAttribute(screen.image)}" data-focus-alt="${escapeAttribute(screen.label)}">
                        ${renderImageTag(screen.image, screen.label, "po-screen-image", 'loading="lazy"')}
                        <span class="po-screen-label">${screen.label}</span>
                    </button>
                `;
            }

            return `
                <div class="po-screen">
                    ${screen.html}
                    <div class="po-screen-label">${screen.label}</div>
                </div>
            `;
        })
        .join("");
}

function renderProjectSections(sections = []) {
    return sections
        .map((section) => {
            const bodyItems = Array.isArray(section.body)
                ? section.body
                : section.body
                    ? [section.body]
                    : [];
            const paragraphs = bodyItems
                .map((paragraph) => `<p>${paragraph}</p>`)
                .join("");
            const list = Array.isArray(section.list) && section.list.length
                ? `
                    <ul class="po-copy-list">
                        ${section.list.map((item) => `<li>${item}</li>`).join("")}
                    </ul>
                `
                : "";
            const heading = section.title
                ? `<h4 class="po-copy-subhead">${section.title}</h4>`
                : "";

            return `
                <div class="po-copy-group">
                    ${heading}
                    ${paragraphs}
                    ${list}
                </div>
            `;
        })
        .join("");
}

function renderWebDeckInfo(index, animate = false) {
    const item = webDeckItems[index];
    if (!item || !webDeckCopy || !webDeckCounter) {
        return;
    }

    const counterText = `${String(index + 1).padStart(2, "0")} / ${String(webDeckItems.length).padStart(2, "0")}`;
    const markup = `
        <div class="webdeck-head">
            <div class="webdeck-count">${counterText}</div>
            <h3 class="webdeck-title">${item.title}</h3>
            <div class="webdeck-meta">${item.category} / ${item.year}</div>
        </div>
        <p class="webdeck-body">${item.desc}</p>
        <div class="webdeck-tags">
            ${item.tags.map((tag) => `<span class="webdeck-tag">${tag}</span>`).join("")}
        </div>
        ${item.url ? `<a class="webdeck-site" href="${item.url}" target="_blank" rel="noreferrer">View live site</a>` : ""}
    `;

    if (animate && typeof window.gsap !== "undefined") {
        window.gsap.to(webDeckCopy, {
            opacity: 0,
            y: 12,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
                webDeckCopy.innerHTML = markup;
                window.gsap.fromTo(webDeckCopy, {
                    opacity: 0,
                    y: -12
                }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.35,
                    ease: "power2.out"
                });
            }
        });
    } else {
        webDeckCopy.innerHTML = markup;
    }

    webDeckCounter.textContent = counterText;
}

function webDeckSlotAt(index, total) {
    return {
        x: index * WEBDECK_CARD_DISTANCE,
        y: -index * WEBDECK_VERTICAL_DISTANCE,
        z: -index * WEBDECK_CARD_DISTANCE * 1.5,
        zIndex: total - index
    };
}

function placeWebDeckNow(element, slot) {
    if (typeof window.gsap !== "undefined") {
        window.gsap.set(element, {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            xPercent: -50,
            yPercent: -50,
            zIndex: slot.zIndex,
            force3D: true
        });
        return;
    }

    element.style.transform = `translate3d(${slot.x}px, ${slot.y}px, ${slot.z}px) translate(-50%, -50%)`;
    element.style.zIndex = String(slot.zIndex);
}

function clearWebDeckInterval() {
    if (!webDeckIntervalId) {
        return;
    }

    window.clearInterval(webDeckIntervalId);
    webDeckIntervalId = null;
}

function resetWebDeckTilt(card, immediate = false) {
    const tiltState = webDeckTiltStates.get(card);
    if (!tiltState) {
        return;
    }

    tiltState.targetRotateX = 0;
    tiltState.targetRotateY = 0;
    tiltState.targetScale = 1;
    tiltState.isHovered = false;
    card.classList.remove("is-hovered");

    if (!immediate) {
        return;
    }

    tiltState.currentRotateX = 0;
    tiltState.currentRotateY = 0;
    tiltState.currentScale = 1;
    tiltState.visual.style.transform = "perspective(1600px) rotateX(0deg) rotateY(0deg) scale(1)";
}

function tickWebDeckTilt(card) {
    const tiltState = webDeckTiltStates.get(card);
    if (!tiltState) {
        return;
    }

    tiltState.currentRotateX += (tiltState.targetRotateX - tiltState.currentRotateX) * 0.28;
    tiltState.currentRotateY += (tiltState.targetRotateY - tiltState.currentRotateY) * 0.28;
    tiltState.currentScale += (tiltState.targetScale - tiltState.currentScale) * 0.24;

    tiltState.visual.style.transform = `perspective(1600px) rotateX(${tiltState.currentRotateX.toFixed(3)}deg) rotateY(${tiltState.currentRotateY.toFixed(3)}deg) scale(${tiltState.currentScale.toFixed(4)})`;

    const needsMoreFrames =
        Math.abs(tiltState.targetRotateX - tiltState.currentRotateX) > 0.02 ||
        Math.abs(tiltState.targetRotateY - tiltState.currentRotateY) > 0.02 ||
        Math.abs(tiltState.targetScale - tiltState.currentScale) > 0.002;

    if (!tiltState.isHovered && !needsMoreFrames) {
        tiltState.rafId = null;
        return;
    }

    tiltState.rafId = window.requestAnimationFrame(() => tickWebDeckTilt(card));
}

function ensureWebDeckTiltFrame(card) {
    const tiltState = webDeckTiltStates.get(card);
    if (!tiltState || tiltState.rafId) {
        return;
    }

    tiltState.rafId = window.requestAnimationFrame(() => tickWebDeckTilt(card));
}

function syncFrontWebDeckTilt(frontCardIndex = webDeckOrder[0]) {
    webDeckCards.forEach((card) => {
        const isFrontCard = Number(card.dataset.webdeckIndex) === frontCardIndex;
        card.classList.toggle("is-tilt-enabled", isFrontCard);

        if (!isFrontCard) {
            resetWebDeckTilt(card, true);
        }
    });
}

function setupWebDeckTilt(card) {
    const visual = card.querySelector(".webdeck-card-tilt");
    if (!visual) {
        return;
    }

    const tiltState = {
        visual,
        rafId: null,
        isHovered: false,
        currentRotateX: 0,
        currentRotateY: 0,
        currentScale: 1,
        targetRotateX: 0,
        targetRotateY: 0,
        targetScale: 1
    };

    webDeckTiltStates.set(card, tiltState);

    card.addEventListener("pointerenter", () => {
        if (!card.classList.contains("is-tilt-enabled")) {
            return;
        }

        tiltState.isHovered = true;
        card.classList.add("is-hovered");
        tiltState.targetScale = WEBDECK_TILT.hoverScale;
        ensureWebDeckTiltFrame(card);
    });

    card.addEventListener("pointermove", (event) => {
        if (!card.classList.contains("is-tilt-enabled")) {
            return;
        }

        const rect = card.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - rect.width / 2;
        const offsetY = event.clientY - rect.top - rect.height / 2;
        const normalizedX = offsetX / (rect.width / 2);
        const normalizedY = offsetY / (rect.height / 2);

        tiltState.targetRotateX = normalizedY * -WEBDECK_TILT.rotateAmplitude;
        tiltState.targetRotateY = normalizedX * WEBDECK_TILT.rotateAmplitude;
        tiltState.targetScale = WEBDECK_TILT.hoverScale;
        ensureWebDeckTiltFrame(card);
    });

    card.addEventListener("pointerleave", () => {
        resetWebDeckTilt(card);
        ensureWebDeckTiltFrame(card);
    });
}

function getWebDeckTargetOrder(direction, order = webDeckOrder) {
    if (direction === -1) {
        const last = order[order.length - 1];
        return [last, ...order.slice(0, -1)];
    }

    const [front, ...rest] = order;
    return [...rest, front];
}

function getWebDeckAnimationOrder(targetOrder) {
    return [targetOrder[targetOrder.length - 1], ...targetOrder.slice(0, -1)];
}

function reorderWebDeck(direction) {
    webDeckOrder = getWebDeckTargetOrder(direction);

    webDeckActiveIndex = webDeckOrder[0];
}

function scheduleWebDeck() {
    clearWebDeckInterval();

    if (isOverlayOpen || webDeckItems.length < 2) {
        return;
    }

    webDeckIntervalId = window.setInterval(() => requestWebDeckSwap(1), WEBDECK_DELAY);
}

function finishWebDeckSwap() {
    webDeckAnimating = false;
    syncFrontWebDeckTilt();

    if (webDeckQueuedDirection) {
        const queuedDirection = webDeckQueuedDirection;
        webDeckQueuedDirection = 0;
        window.requestAnimationFrame(() => swapWebDeck(queuedDirection));
        return;
    }

    scheduleWebDeck();
}

function requestWebDeckSwap(direction = 1) {
    if (webDeckAnimating) {
        webDeckQueuedDirection = direction;
        return;
    }

    webDeckQueuedDirection = 0;
    swapWebDeck(direction);
}

function swapWebDeck(direction = 1) {
    if (!webDeckCards.length || webDeckAnimating) {
        return;
    }

    if (typeof window.gsap === "undefined") {
        reorderWebDeck(direction);
        webDeckOrder.forEach((cardIndex, visualIndex) => {
            placeWebDeckNow(webDeckCards[cardIndex], webDeckSlotAt(visualIndex, webDeckCards.length));
        });
        syncFrontWebDeckTilt();
        renderWebDeckInfo(webDeckActiveIndex);
        scheduleWebDeck();
        return;
    }

    webDeckAnimating = true;
    webDeckTimeline?.kill();
    clearWebDeckInterval();
    webDeckCards.forEach((card) => resetWebDeckTilt(card, true));
    webDeckCards.forEach((card) => card.classList.remove("is-tilt-enabled"));
    const targetOrder = getWebDeckTargetOrder(direction);
    const animationOrder = getWebDeckAnimationOrder(targetOrder);
    const [movingCardIndex, ...promotedCards] = animationOrder;
    const nextFront = targetOrder[0];
    const movingElement = webDeckCards[movingCardIndex];
    const timeline = window.gsap.timeline({
        onComplete: () => {
            webDeckOrder = targetOrder;
            webDeckActiveIndex = webDeckOrder[0];
            finishWebDeckSwap();
        }
    });
    webDeckTimeline = timeline;

    timeline.to(movingElement, {
        y: "+=520",
        duration: WEBDECK_MOTION.durDrop,
        ease: WEBDECK_MOTION.ease
    });

    timeline.addLabel("promote", `-=${WEBDECK_MOTION.durDrop * WEBDECK_MOTION.promoteOverlap}`);
    timeline.call(() => renderWebDeckInfo(nextFront, true), undefined, "promote+=0.06");
    timeline.call(() => syncFrontWebDeckTilt(nextFront), undefined, "promote+=0.18");

    promotedCards.forEach((cardIndex, visualIndex) => {
        const card = webDeckCards[cardIndex];
        const slot = webDeckSlotAt(visualIndex, webDeckCards.length);
        timeline.set(card, { zIndex: slot.zIndex }, "promote");
        timeline.to(card, {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: WEBDECK_MOTION.durMove,
            ease: WEBDECK_MOTION.ease
        }, `promote+=${visualIndex * 0.1}`);
    });

    const backSlot = webDeckSlotAt(webDeckCards.length - 1, webDeckCards.length);
    timeline.addLabel("return", `promote+=${WEBDECK_MOTION.durMove * WEBDECK_MOTION.returnDelay}`);
    timeline.call(() => {
        window.gsap.set(movingElement, { zIndex: backSlot.zIndex });
    }, undefined, "return");
    timeline.to(movingElement, {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: WEBDECK_MOTION.durReturn,
        ease: WEBDECK_MOTION.ease
    }, "return");
    timeline.timeScale(WEBDECK_MOTION.speedMultiplier);
}

function initWebsiteDeck() {
    if (!webDeckStage || !webDeckCopy || !webDeckItems.length) {
        return;
    }

    webDeckOrder = webDeckItems.map((_, index) => index);
    webDeckActiveIndex = webDeckOrder[0];
    webDeckStage.innerHTML = webDeckItems.map((item, index) => `
        <article class="webdeck-card" data-webdeck-index="${index}" data-project-key="${item.key}" aria-label="${item.title}" role="button" tabindex="0">
            <div class="webdeck-card-tilt">
                <div class="webdeck-browser">
                    <span class="webdeck-dot"></span>
                    <span class="webdeck-dot"></span>
                    <span class="webdeck-dot"></span>
                    <div class="webdeck-url">${item.url.replace(/^https?:\/\//, "")}</div>
                </div>
                <div class="webdeck-shot">
                    ${renderImageTag(item.image, item.title, "", 'loading="lazy"')}
                </div>
                <div class="webdeck-label">
                    <strong>${item.title}</strong>
                    <span>${item.category}</span>
                </div>
            </div>
        </article>
    `).join("");

    webDeckCards = Array.from(webDeckStage.querySelectorAll(".webdeck-card"));

    webDeckCards.forEach((card, visualIndex) => {
        placeWebDeckNow(card, webDeckSlotAt(visualIndex, webDeckCards.length));
        setupWebDeckTilt(card);

        const key = card.dataset.projectKey;
        const openCard = () => openOverlay(key);
        card.addEventListener("click", openCard);
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCard();
            }
        });
    });

    webDeckControls.forEach((button) => {
        button.addEventListener("click", () => {
            requestWebDeckSwap(button.dataset.webdeckDir === "next" ? 1 : -1);
        });
    });

    syncFrontWebDeckTilt();
    renderWebDeckInfo(webDeckActiveIndex);
    scheduleWebDeck();
}

function openOverlay(key) {
    const entry = getEntry(key);
    const preview = getPreview(key);

    if (!entry || !overlay) {
        return;
    }

    const heroImageAttributes = entry.heroImagePosition
        ? `style="object-position:${escapeAttribute(entry.heroImagePosition)};"`
        : "";
    const heroMarkup = entry.heroImage
        ? renderFocusableOverlayImage(entry.heroImage, entry.client, "po-hero-focus", "po-hero-image", heroImageAttributes)
        : preview?.screenshotUrl
            ? renderFocusableOverlayImage(preview.screenshotUrl, entry.client, "po-hero-focus", "po-hero-image", heroImageAttributes)
            : entry.heroHtml || preview?.html || "";

    overlayFields.num.textContent = entry.num;
    overlayFields.eyebrow.textContent = entry.eyebrow;
    overlayFields.title.innerHTML = entry.title;
    overlayFields.ghost.textContent = entry.ghost;
    overlayFields.client.textContent = entry.client;
    overlayFields.year.textContent = entry.year;
    overlayFields.type.textContent = entry.type;
    overlayFields.desc.innerHTML = entry.descSections?.length ? renderProjectSections(entry.descSections) : entry.desc;
    overlayFields.role.innerHTML = entry.roleSections?.length ? renderProjectSections(entry.roleSections) : entry.role;
    overlayFields.hero.innerHTML = heroMarkup;
    overlayFields.stack.innerHTML = entry.stack
        .map((item) => `<span class="po-pill">${item}</span>`)
        .join("");
    overlayFields.screens.innerHTML = renderProjectScreens(entry.screens);
    overlayFields.preview.innerHTML = renderOverlayPreview(key);
    overlayFields.previewDivider.style.display = overlayFields.preview.innerHTML ? "" : "none";

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    overlay.scrollTop = 0;
    document.body.classList.add("no-scroll");
    isOverlayOpen = true;
    clearWebDeckInterval();
}

function closeOverlay() {
    if (!overlay) {
        return;
    }

    closeImageFocus();
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    isOverlayOpen = false;
    if (!webDeckAnimating) {
        scheduleWebDeck();
    }
}

function initInteractiveCards(selector, dataKey) {
    document.querySelectorAll(selector).forEach((element) => {
        const key = element.dataset[dataKey];
        if (!key) {
            return;
        }

        element.addEventListener("mouseenter", (event) => showPreview(getPreview(key), event));
        element.addEventListener("mousemove", positionPreview);
        element.addEventListener("mouseleave", hidePreview);
        element.addEventListener("click", () => openOverlay(key));
    });
}

function openImageFocus(src, alt = "") {
    if (!imageFocusOverlay || !imageFocusImage || !src) {
        return;
    }

    imageFocusImage.src = src;
    imageFocusImage.alt = alt;
    if (imageFocusCaption) {
        imageFocusCaption.textContent = alt;
    }

    imageFocusOverlay.classList.add("open");
    imageFocusOverlay.setAttribute("aria-hidden", "false");
    isImageFocusOpen = true;
}

function closeImageFocus() {
    if (!imageFocusOverlay || !imageFocusImage) {
        return;
    }

    imageFocusOverlay.classList.remove("open");
    imageFocusOverlay.setAttribute("aria-hidden", "true");
    imageFocusImage.removeAttribute("src");
    imageFocusImage.alt = "";
    if (imageFocusCaption) {
        imageFocusCaption.textContent = "";
    }

    isImageFocusOpen = false;
}

function initImageFocus() {
    if (!overlay || !imageFocusOverlay || !imageFocusCloseButton) {
        return;
    }

    overlay.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-focus-src]");
        if (!trigger) {
            return;
        }

        openImageFocus(trigger.dataset.focusSrc, trigger.dataset.focusAlt || "");
    });

    overlay.addEventListener("keydown", (event) => {
        const trigger = event.target.closest("[data-focus-src]");
        if (!trigger || (event.key !== "Enter" && event.key !== " ")) {
            return;
        }

        event.preventDefault();
        openImageFocus(trigger.dataset.focusSrc, trigger.dataset.focusAlt || "");
    });

    imageFocusCloseButton.addEventListener("click", closeImageFocus);
    imageFocusOverlay.addEventListener("click", (event) => {
        if (event.target === imageFocusOverlay) {
            closeImageFocus();
        }
    });
}

function initOverlay() {
    if (!closeOverlayButton || !overlay) {
        return;
    }

    closeOverlayButton.addEventListener("click", closeOverlay);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (isImageFocusOpen) {
                closeImageFocus();
                return;
            }

            closeOverlay();
        }
    });
}

initCursor();
initRevealAnimations();
initScrollMotion();
initWebsiteDeck();
initInteractiveCards(".gc[data-game]", "game");
initImageFocus();
initOverlay();
