const { work = {} } = window.portfolioData || {};

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
let mouseX = 0;
let mouseY = 0;
let ringX = 0;
let ringY = 0;
let hidePreviewTimer;
let isOverlayOpen = false;
let isImageFocusOpen = false;

const decks = [];
const DECK_CARD_DISTANCE = 72;
const DECK_VERTICAL_DISTANCE = 78;
const DECK_DELAY = 4200;
const DECK_TILT = {
    rotateAmplitude: 12,
    hoverScale: 1.045
};
const DECK_MOTION = {
    ease: "power3.out",
    durDrop: 0.8,
    durMove: 0.9,
    durReturn: 0.85,
    promoteOverlap: 0.78,
    returnDelay: 0.04,
    speedMultiplier: 5
};

function getEntry(key) {
    return work[key];
}

function getPreviewLabel(entry) {
    // Games carry their own chrome label; websites just show their domain.
    return entry.preview?.label || (entry.liveUrl || "").replace(/^https?:\/\//, "");
}

function getSummary(entry) {
    // descSections[0] is authored as a standalone opening paragraph, so the
    // deck can use it directly instead of chopping the full body with a regex.
    const opening = entry.descSections?.[0]?.body;
    return stripHtml(Array.isArray(opening) ? opening[0] : opening || "");
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

function getDeckItems(medium) {
    return Object.entries(work)
        .filter(([, entry]) => entry.medium === medium)
        .sort(([, a], [, b]) => String(a.num).localeCompare(String(b.num), undefined, { numeric: true }))
        .map(([key, entry]) => {
            const image = entry.screens?.[0]?.image || entry.preview?.screenshotUrl || "";

            return {
                key,
                name: entry.name,
                category: entry.type,
                year: entry.year,
                url: entry.liveUrl || "",
                // websites show their domain in the card chrome, games their engine
                chrome: entry.liveUrl ? entry.liveUrl.replace(/^https?:\/\//, "") : entry.eyebrow,
                image,
                html: image ? "" : (entry.preview?.html || entry.heroHtml || ""),
                desc: getSummary(entry),
                tags: (entry.stack || []).slice(0, 3)
            };
        })
        .filter((item) => item.image || item.html);
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

function renderPreviewMedia(media, alt, imageClassName) {
    if (!media) {
        return "";
    }

    if (media.screenshotUrl) {
        return renderImageTag(media.screenshotUrl, alt, imageClassName, 'fetchpriority="low"');
    }

    return media.html || "";
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
    const panelTargets = Array.from(document.querySelectorAll(".ci"));
    const ghostTargets = Array.from(document.querySelectorAll(".ghost-bg, .section-ghost"));

    if (!deckTargets.length && !panelTargets.length && !ghostTargets.length) {
        return;
    }

    const motionTargets = [
        ...deckTargets.map((element, index) => ({
            element,
            kind: "deck",
            direction: index % 2 === 0 ? 1 : -1
        })),
        ...panelTargets.map((element) => ({ element, kind: "panel", direction: 1 })),
        ...ghostTargets.map((element) => ({ element, kind: "ghost", direction: 1 }))
    ];

    let isTicking = false;

    function applyMotion() {
        isTicking = false;
        const viewportHeight = window.innerHeight || 1;

        // Every rect is read before any style is written. Interleaving the two
        // makes the browser recompute layout once per element, per frame.
        const progressValues = motionTargets.map(({ element }) => {
            const rect = element.getBoundingClientRect();
            const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
            return Math.max(-1, Math.min(1, centerOffset / viewportHeight));
        });

        motionTargets.forEach(({ element, kind, direction }, index) => {
            const progress = progressValues[index];

            if (kind === "deck") {
                element.style.setProperty("--scroll-lift", `${progress * -14}px`);
                element.style.setProperty("--scroll-roll", `${progress * 1.8 * direction}deg`);
                return;
            }

            if (kind === "panel") {
                element.style.setProperty("--scroll-lift", `${progress * -16}px`);
                return;
            }

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

function showPreview(entry, event) {
    if (!entry?.preview || !previewPopup || !previewScreen || !previewUrl || !previewName) {
        return;
    }

    window.clearTimeout(hidePreviewTimer);
    previewScreen.innerHTML = renderPreviewMedia(entry.preview, entry.client, "preview-image");
    previewUrl.textContent = getPreviewLabel(entry);
    previewName.textContent = entry.client;
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
    const entry = getEntry(key);

    if (!entry) {
        return "";
    }

    const media = renderPreviewMedia(entry.preview, entry.client, "po-preview-image");
    if (!media) {
        return "";
    }

    if (entry.liveUrl) {
        return `
            <a href="${entry.liveUrl}" class="po-preview-link" target="_blank" rel="noreferrer" aria-label="Open ${entry.client} live site">
                <div class="po-preview-card">
                    <div class="po-preview-media">${media}</div>
                    <div class="po-preview-caption">
                        <span>${entry.client}</span>
                        <span class="po-preview-icon" aria-hidden="true">\u2197</span>
                    </div>
                </div>
            </a>
        `;
    }

    return `
        <div class="po-preview-card">
            <div class="po-preview-media">${media}</div>
            <div class="po-preview-caption">${entry.client}</div>
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

function renderDeckCard(item, index) {
    const chrome = item.url
        ? `<span class="webdeck-dot"></span><span class="webdeck-dot"></span><span class="webdeck-dot"></span>
                    <div class="webdeck-url">${escapeAttribute(item.chrome)}</div>`
        : `<div class="webdeck-url webdeck-url-plain">${escapeAttribute(item.chrome)}</div>`;

    // Projects with no capture fall back to their inline mock-up.
    const media = item.image
        ? renderImageTag(item.image, item.name, "", 'loading="lazy"')
        : item.html;

    return `
        <article class="webdeck-card" data-deck-index="${index}" data-project-key="${item.key}" aria-label="${escapeAttribute(item.name)}" role="button" tabindex="0">
            <div class="webdeck-card-tilt">
                <div class="webdeck-browser">${chrome}</div>
                <div class="webdeck-shot">${media}</div>
                <div class="webdeck-label">
                    <strong>${item.name}</strong>
                    <span>${item.category}</span>
                </div>
            </div>
        </article>
    `;
}

function createDeck(root) {
    const items = getDeckItems(root.dataset.deck);
    const copy = root.querySelector("[data-deck-copy]");
    const counter = root.querySelector("[data-deck-counter]");
    const stage = root.querySelector("[data-deck-stage]");
    const controls = Array.from(root.querySelectorAll("[data-deck-dir]"));

    if (!stage || !copy || !items.length) {
        return null;
    }

    // Which way the stack recedes. The mirrored games deck runs right-to-left
    // so the cards fall away from the copy beside them.
    const stackDirection = root.dataset.deckStack === "rtl" ? -1 : 1;
    const tiltStates = new WeakMap();
    let order = items.map((_, index) => index);
    let cards = [];
    let activeIndex = order[0];
    let intervalId = null;
    let timeline = null;
    let animating = false;
    let queuedDirection = 0;
    let copyTween = null;

    function slotAt(index, total) {
        return {
            x: index * DECK_CARD_DISTANCE * stackDirection,
            y: -index * DECK_VERTICAL_DISTANCE,
            z: -index * DECK_CARD_DISTANCE * 1.5,
            zIndex: total - index
        };
    }

    function placeNow(element, slot) {
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

    function clearTimer() {
        if (!intervalId) {
            return;
        }

        window.clearInterval(intervalId);
        intervalId = null;
    }

    function schedule() {
        clearTimer();

        if (isOverlayOpen || items.length < 2) {
            return;
        }

        intervalId = window.setInterval(() => requestSwap(1), DECK_DELAY);
    }

    function resetTilt(card, immediate = false) {
        const tiltState = tiltStates.get(card);
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

    function tickTilt(card) {
        const tiltState = tiltStates.get(card);
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

        tiltState.rafId = window.requestAnimationFrame(() => tickTilt(card));
    }

    function ensureTiltFrame(card) {
        const tiltState = tiltStates.get(card);
        if (!tiltState || tiltState.rafId) {
            return;
        }

        tiltState.rafId = window.requestAnimationFrame(() => tickTilt(card));
    }

    function syncFrontTilt(frontCardIndex = order[0]) {
        cards.forEach((card) => {
            const isFrontCard = Number(card.dataset.deckIndex) === frontCardIndex;
            card.classList.toggle("is-tilt-enabled", isFrontCard);

            if (!isFrontCard) {
                resetTilt(card, true);
            }
        });
    }

    function setupTilt(card) {
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

        tiltStates.set(card, tiltState);

        card.addEventListener("pointerenter", () => {
            if (!card.classList.contains("is-tilt-enabled")) {
                return;
            }

            tiltState.isHovered = true;
            card.classList.add("is-hovered");
            tiltState.targetScale = DECK_TILT.hoverScale;
            ensureTiltFrame(card);
        });

        card.addEventListener("pointermove", (event) => {
            if (!card.classList.contains("is-tilt-enabled")) {
                return;
            }

            const rect = card.getBoundingClientRect();
            const offsetX = event.clientX - rect.left - rect.width / 2;
            const offsetY = event.clientY - rect.top - rect.height / 2;

            tiltState.targetRotateX = (offsetY / (rect.height / 2)) * -DECK_TILT.rotateAmplitude;
            tiltState.targetRotateY = (offsetX / (rect.width / 2)) * DECK_TILT.rotateAmplitude;
            tiltState.targetScale = DECK_TILT.hoverScale;
            ensureTiltFrame(card);
        });

        card.addEventListener("pointerleave", () => {
            resetTilt(card);
            ensureTiltFrame(card);
        });
    }

    function targetOrderFor(direction) {
        if (direction === -1) {
            const last = order[order.length - 1];
            return [last, ...order.slice(0, -1)];
        }

        const [front, ...rest] = order;
        return [...rest, front];
    }

    function renderInfo(index, animate = false) {
        const item = items[index];
        if (!item) {
            return;
        }

        const counterText = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
        const markup = `
            <div class="webdeck-head">
                <div class="webdeck-count">${counterText}</div>
                <h3 class="webdeck-title">${item.name}</h3>
                <div class="webdeck-meta">${item.category} / ${item.year}</div>
            </div>
            <p class="webdeck-body">${item.desc}</p>
            <div class="webdeck-tags">
                ${item.tags.map((tag) => `<span class="webdeck-tag">${tag}</span>`).join("")}
            </div>
            ${item.url ? `<a class="webdeck-site" href="${item.url}" target="_blank" rel="noreferrer">View live site</a>` : ""}
        `;

        // Counter and copy are written together — updating the counter outside
        // the tween let a queued swap leave them showing different projects.
        const apply = () => {
            copy.innerHTML = markup;
            if (counter) {
                counter.textContent = counterText;
            }
        };

        // A second swap arriving mid-fade used to start a competing opacity
        // tween, and the panel settled near-invisible. Only one may run.
        copyTween?.kill();

        if (animate && typeof window.gsap !== "undefined") {
            copyTween = window.gsap.to(copy, {
                opacity: 0,
                y: 12,
                duration: 0.2,
                ease: "power2.out",
                onComplete: () => {
                    apply();
                    copyTween = window.gsap.fromTo(copy, { opacity: 0, y: -12 }, {
                        opacity: 1,
                        y: 0,
                        duration: 0.35,
                        ease: "power2.out"
                    });
                }
            });
            return;
        }

        window.gsap?.set(copy, { opacity: 1, y: 0 });
        apply();
    }

    function finishSwap() {
        animating = false;
        syncFrontTilt();

        if (queuedDirection) {
            const direction = queuedDirection;
            queuedDirection = 0;
            window.requestAnimationFrame(() => swap(direction));
            return;
        }

        schedule();
    }

    function requestSwap(direction = 1) {
        if (animating) {
            queuedDirection = direction;
            return;
        }

        queuedDirection = 0;
        swap(direction);
    }

    function swap(direction = 1) {
        if (!cards.length || animating) {
            return;
        }

        if (typeof window.gsap === "undefined") {
            order = targetOrderFor(direction);
            activeIndex = order[0];
            order.forEach((cardIndex, visualIndex) => {
                placeNow(cards[cardIndex], slotAt(visualIndex, cards.length));
            });
            syncFrontTilt();
            renderInfo(activeIndex);
            schedule();
            return;
        }

        animating = true;
        timeline?.kill();
        clearTimer();
        cards.forEach((card) => {
            resetTilt(card, true);
            card.classList.remove("is-tilt-enabled");
        });

        const nextOrder = targetOrderFor(direction);
        const animationOrder = [nextOrder[nextOrder.length - 1], ...nextOrder.slice(0, -1)];
        const [movingCardIndex, ...promotedCards] = animationOrder;
        const nextFront = nextOrder[0];
        const movingElement = cards[movingCardIndex];

        timeline = window.gsap.timeline({
            onComplete: () => {
                order = nextOrder;
                activeIndex = order[0];
                finishSwap();
            }
        });

        timeline.to(movingElement, {
            y: "+=520",
            duration: DECK_MOTION.durDrop,
            ease: DECK_MOTION.ease
        });

        timeline.addLabel("promote", `-=${DECK_MOTION.durDrop * DECK_MOTION.promoteOverlap}`);
        timeline.call(() => renderInfo(nextFront, true), undefined, "promote+=0.06");
        timeline.call(() => syncFrontTilt(nextFront), undefined, "promote+=0.18");

        promotedCards.forEach((cardIndex, visualIndex) => {
            const card = cards[cardIndex];
            const slot = slotAt(visualIndex, cards.length);
            timeline.set(card, { zIndex: slot.zIndex }, "promote");
            timeline.to(card, {
                x: slot.x,
                y: slot.y,
                z: slot.z,
                duration: DECK_MOTION.durMove,
                ease: DECK_MOTION.ease
            }, `promote+=${visualIndex * 0.1}`);
        });

        const backSlot = slotAt(cards.length - 1, cards.length);
        timeline.addLabel("return", `promote+=${DECK_MOTION.durMove * DECK_MOTION.returnDelay}`);
        timeline.call(() => {
            window.gsap.set(movingElement, { zIndex: backSlot.zIndex });
        }, undefined, "return");
        timeline.to(movingElement, {
            x: backSlot.x,
            y: backSlot.y,
            z: backSlot.z,
            duration: DECK_MOTION.durReturn,
            ease: DECK_MOTION.ease
        }, "return");
        timeline.timeScale(DECK_MOTION.speedMultiplier);
    }

    stage.innerHTML = items.map(renderDeckCard).join("");
    cards = Array.from(stage.querySelectorAll(".webdeck-card"));

    cards.forEach((card, visualIndex) => {
        placeNow(card, slotAt(visualIndex, cards.length));
        setupTilt(card);

        const open = () => openOverlay(card.dataset.projectKey);
        card.addEventListener("click", open);
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
            }
        });
        card.addEventListener("mouseenter", (event) => showPreview(getEntry(card.dataset.projectKey), event));
        card.addEventListener("mousemove", positionPreview);
        card.addEventListener("mouseleave", hidePreview);
    });

    controls.forEach((button) => {
        button.addEventListener("click", () => {
            requestSwap(button.dataset.deckDir === "next" ? 1 : -1);
        });
    });

    syncFrontTilt();
    renderInfo(activeIndex);
    schedule();

    return {
        pause: clearTimer,
        resume: () => {
            if (!animating) {
                schedule();
            }
        }
    };
}

function initDecks() {
    document.querySelectorAll("[data-deck]").forEach((root) => {
        const deck = createDeck(root);
        if (deck) {
            decks.push(deck);
        }
    });
}

function openOverlay(key) {
    const entry = getEntry(key);

    if (!entry || !overlay) {
        return;
    }

    const heroImageAttributes = entry.heroImagePosition
        ? `style="object-position:${escapeAttribute(entry.heroImagePosition)};"`
        : "";
    const heroMarkup = entry.heroImage
        ? renderFocusableOverlayImage(entry.heroImage, entry.client, "po-hero-focus", "po-hero-image", heroImageAttributes)
        : entry.preview?.screenshotUrl
            ? renderFocusableOverlayImage(entry.preview.screenshotUrl, entry.client, "po-hero-focus", "po-hero-image", heroImageAttributes)
            : entry.heroHtml || entry.preview?.html || "";

    overlayFields.num.textContent = entry.num;
    overlayFields.eyebrow.textContent = entry.eyebrow;
    overlayFields.title.innerHTML = entry.title;
    overlayFields.ghost.textContent = entry.ghost;
    overlayFields.client.textContent = entry.client;
    overlayFields.year.textContent = entry.year;
    overlayFields.type.textContent = entry.type;
    overlayFields.desc.innerHTML = renderProjectSections(entry.descSections);
    overlayFields.role.innerHTML = renderProjectSections(entry.roleSections);
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
    decks.forEach((deck) => deck.pause());
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
    decks.forEach((deck) => deck.resume());
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

function initMarquees() {
    // Each track scrolls to -50%, so it needs exactly two identical halves. The
    // markup carries one; the duplicate is decorative and cloned here.
    document.querySelectorAll(".marquee-track").forEach((track) => {
        const item = track.firstElementChild;
        if (!item || track.children.length > 1) {
            return;
        }

        track.appendChild(item.cloneNode(true));
    });
}

function initCurrentYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll("[data-year]").forEach((element) => {
        element.textContent = year;
    });
}

initCursor();
initMarquees();
initCurrentYear();
initRevealAnimations();
initScrollMotion();
initDecks();
initImageFocus();
initOverlay();
