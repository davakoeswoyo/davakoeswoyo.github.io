(function () {
    const THREE_MODULE_URL = new URL("js/vendor/three.module.js", document.baseURI).href;
    const DEFAULTS = {
        topColor: "#5227ff",
        bottomColor: "#ff9ffc",
        intensity: 0.9,
        rotationSpeed: 0.1,
        interactive: false,
        glowAmount: 0.005,
        pillarWidth: 2.5,
        pillarHeight: 0.9,
        noiseIntensity: 0.1,
        mixBlendMode: "screen",
        pillarRotation: 90,
        quality: "high"
    };
    let activeInstance = null;
    let bootToken = 0;
    let threeModulePromise = null;

    function supportsWebGL() {
        const canvas = document.createElement("canvas");
        return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    }

    function loadThree() {
        if (!threeModulePromise) {
            threeModulePromise = import(THREE_MODULE_URL);
        }

        return threeModulePromise;
    }

    function detectQuality(quality) {
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isNarrowViewport = window.matchMedia("(max-width: 860px)").matches;
        const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
        const isMobile = isMobileUserAgent || isNarrowViewport || hasCoarsePointer;
        const isLowEndDevice = isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
        let effectiveQuality = quality;

        if (isLowEndDevice && quality === "high") {
            effectiveQuality = "medium";
        }

        if (isMobile && quality !== "low") {
            effectiveQuality = "low";
        }

        return {
            effectiveQuality,
            settings: {
                low: {
                    iterations: 24,
                    waveIterations: 1,
                    pixelRatio: Math.min(window.devicePixelRatio || 1, 1),
                    precision: "mediump",
                    stepMultiplier: 1.5,
                    targetFPS: 30
                },
                medium: {
                    iterations: 40,
                    waveIterations: 2,
                    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.25),
                    precision: "mediump",
                    stepMultiplier: 1.2,
                    targetFPS: 45
                },
                high: {
                    iterations: 80,
                    waveIterations: 4,
                    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
                    precision: "highp",
                    stepMultiplier: 1.0,
                    targetFPS: 60
                }
            }[effectiveQuality]
        };
    }

    function mountFallback(container) {
        if (container.querySelector(".light-pillar-fallback")) {
            return;
        }

        const fallback = document.createElement("div");
        fallback.className = "light-pillar-fallback";
        fallback.setAttribute("aria-hidden", "true");
        container.appendChild(fallback);
        container.classList.add("light-pillar-ready");
    }

    function unmountFallback(container) {
        const fallback = container.querySelector(".light-pillar-fallback");

        if (fallback) {
            fallback.remove();
        }
    }

    function addMediaListener(queryList, listener) {
        if (typeof queryList.addEventListener === "function") {
            queryList.addEventListener("change", listener);
            return () => queryList.removeEventListener("change", listener);
        }

        queryList.addListener(listener);
        return () => queryList.removeListener(listener);
    }

    async function createLightPillar(options = {}, currentBootToken = 0) {
        const container = document.getElementById("hero-pillar");
        if (!container) {
            return null;
        }

        const config = { ...DEFAULTS, ...options };
        let profile = detectQuality(config.quality);

        Object.assign(container.style, { mixBlendMode: config.mixBlendMode });

        if (!supportsWebGL()) {
            mountFallback(container);
            return null;
        }

        let THREE;
        try {
            THREE = await loadThree();
        } catch (error) {
            mountFallback(container);
            return null;
        }

        if (currentBootToken !== bootToken) {
            return null;
        }

        const size = new THREE.Vector2();
        const mouse = new THREE.Vector2(0, 0);
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const pillarRotationRadians = (config.pillarRotation * Math.PI) / 180;
        const waveSin = Math.sin(0.4);
        const waveCos = Math.cos(0.4);
        let renderer;

        try {
            renderer = new THREE.WebGLRenderer({
                antialias: false,
                alpha: true,
                powerPreference: profile.effectiveQuality === "high" ? "high-performance" : "low-power",
                precision: profile.settings.precision,
                stencil: false,
                depth: false
            });
        } catch (error) {
            mountFallback(container);
            return null;
        }

        function parseColor(hex) {
            const color = new THREE.Color(hex);
            return new THREE.Vector3(color.r, color.g, color.b);
        }

        function syncSize() {
            const width = Math.max(container.clientWidth || window.innerWidth, 1);
            const height = Math.max(container.clientHeight || window.innerHeight, 1);
            size.set(width, height);
            renderer.setPixelRatio(profile.settings.pixelRatio);
            renderer.setSize(width, height, false);
        }

        unmountFallback(container);
        syncSize();
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.style.mixBlendMode = config.mixBlendMode;
        container.appendChild(renderer.domElement);

        const vertexShader = `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            precision ${profile.settings.precision} float;

            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec2 uMouse;
            uniform vec3 uTopColor;
            uniform vec3 uBottomColor;
            uniform float uIntensity;
            uniform bool uInteractive;
            uniform float uGlowAmount;
            uniform float uPillarWidth;
            uniform float uPillarHeight;
            uniform float uNoiseIntensity;
            uniform float uRotCos;
            uniform float uRotSin;
            uniform float uPillarRotCos;
            uniform float uPillarRotSin;
            uniform float uWaveSin;
            uniform float uWaveCos;
            varying vec2 vUv;

            const float STEP_MULT = ${profile.settings.stepMultiplier.toFixed(1)};
            const int MAX_ITER = ${profile.settings.iterations};
            const int WAVE_ITER = ${profile.settings.waveIterations};

            void main() {
                vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
                uv = vec2(
                    uPillarRotCos * uv.x - uPillarRotSin * uv.y,
                    uPillarRotSin * uv.x + uPillarRotCos * uv.y
                );

                vec3 ro = vec3(0.0, 0.0, -10.0);
                vec3 rd = normalize(vec3(uv, 1.0));

                float rotC = uRotCos;
                float rotS = uRotSin;
                if (uInteractive && (uMouse.x != 0.0 || uMouse.y != 0.0)) {
                    float angle = uMouse.x * 6.283185;
                    rotC = cos(angle);
                    rotS = sin(angle);
                }

                vec3 col = vec3(0.0);
                float t = 0.1;

                for (int i = 0; i < MAX_ITER; i++) {
                    vec3 p = ro + rd * t;
                    p.xz = vec2(
                        rotC * p.x - rotS * p.z,
                        rotS * p.x + rotC * p.z
                    );

                    vec3 q = p;
                    q.y = p.y * uPillarHeight + uTime;

                    float freq = 1.0;
                    float amp = 1.0;
                    for (int j = 0; j < WAVE_ITER; j++) {
                        q.xz = vec2(
                            uWaveCos * q.x - uWaveSin * q.z,
                            uWaveSin * q.x + uWaveCos * q.z
                        );
                        q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp;
                        freq *= 2.0;
                        amp *= 0.5;
                    }

                    float d = length(cos(q.xz)) - 0.2;
                    float bound = length(p.xz) - uPillarWidth;
                    float k = 4.0;
                    float h = max(k - abs(d - bound), 0.0);
                    d = max(d, bound) + h * h * 0.0625 / k;
                    d = abs(d) * 0.15 + 0.01;

                    float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);
                    col += mix(uBottomColor, uTopColor, grad) / d;

                    t += d * STEP_MULT;
                    if (t > 50.0) {
                        break;
                    }
                }

                float widthNorm = uPillarWidth / 3.0;
                col = tanh(col * uGlowAmount / widthNorm);
                col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;
                gl_FragColor = vec4(col * uIntensity, 1.0);
            }
        `;

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: size.clone() },
                uMouse: { value: mouse },
                uTopColor: { value: parseColor(config.topColor) },
                uBottomColor: { value: parseColor(config.bottomColor) },
                uIntensity: { value: config.intensity },
                uInteractive: { value: config.interactive },
                uGlowAmount: { value: config.glowAmount },
                uPillarWidth: { value: config.pillarWidth },
                uPillarHeight: { value: config.pillarHeight },
                uNoiseIntensity: { value: config.noiseIntensity },
                uRotCos: { value: 1.0 },
                uRotSin: { value: 0.0 },
                uPillarRotCos: { value: Math.cos(pillarRotationRadians) },
                uPillarRotSin: { value: Math.sin(pillarRotationRadians) },
                uWaveSin: { value: waveSin },
                uWaveCos: { value: waveCos }
            },
            transparent: true,
            depthWrite: false,
            depthTest: false
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        container.classList.add("light-pillar-ready");

        let isDestroyed = false;
        let mouseMoveTimer = 0;
        let resizeTimer = 0;
        const onPointerMove = (event) => {
            if (!config.interactive) {
                return;
            }

            if (mouseMoveTimer) {
                return;
            }

            mouseMoveTimer = window.setTimeout(() => {
                mouseMoveTimer = 0;
            }, 16);

            const rect = container.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            mouse.set(x, y);
        };

        let removeMediaListeners = [];
        let resizeObserver = null;

        if (config.interactive) {
            window.addEventListener("pointermove", onPointerMove, { passive: true });
        }

        let rafId = 0;
        let lastTime = performance.now();
        let elapsed = 0;
        const frameTime = 1000 / profile.settings.targetFPS;

        function renderFrame() {
            material.uniforms.uTime.value = elapsed;
            material.uniforms.uRotCos.value = Math.cos(elapsed * 0.3);
            material.uniforms.uRotSin.value = Math.sin(elapsed * 0.3);
            renderer.render(scene, camera);
        }

        function destroy() {
            if (isDestroyed) {
                return;
            }

            isDestroyed = true;
            window.clearTimeout(mouseMoveTimer);
            window.clearTimeout(resizeTimer);
            window.cancelAnimationFrame(rafId);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
            window.visualViewport?.removeEventListener("resize", onResize);
            window.removeEventListener("pagehide", onPageHide);
            document.removeEventListener("visibilitychange", onVisibilityChange);
            renderer.domElement.removeEventListener("webglcontextlost", onContextLost);

            if (config.interactive) {
                window.removeEventListener("pointermove", onPointerMove);
            }

            removeMediaListeners.forEach((removeListener) => removeListener());

            if (resizeObserver) {
                resizeObserver.disconnect();
            }

            renderer.dispose();
            renderer.forceContextLoss();
            material.dispose();
            geometry.dispose();

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        }

        function requestRebuild() {
            if (isDestroyed) {
                return;
            }

            destroy();
            window.setTimeout(() => {
                bootLightPillar(config);
            }, 0);
        }

        const animate = (currentTime) => {
            if (isDestroyed) {
                return;
            }

            const deltaTime = currentTime - lastTime;

            if (deltaTime >= frameTime) {
                elapsed += 0.016 * config.rotationSpeed;
                renderFrame();
                lastTime = currentTime - (deltaTime % frameTime);
            }

            rafId = window.requestAnimationFrame(animate);
        };

        const onVisibilityChange = () => {
            if (isDestroyed) {
                return;
            }

            if (document.hidden) {
                window.cancelAnimationFrame(rafId);
                return;
            }

            lastTime = performance.now();
            rafId = window.requestAnimationFrame(animate);
        };

        const onResize = () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => {
                if (isDestroyed) {
                    return;
                }

                const nextProfile = detectQuality(config.quality);
                const profileChanged =
                    nextProfile.effectiveQuality !== profile.effectiveQuality ||
                    nextProfile.settings.precision !== profile.settings.precision ||
                    nextProfile.settings.iterations !== profile.settings.iterations ||
                    nextProfile.settings.waveIterations !== profile.settings.waveIterations ||
                    nextProfile.settings.stepMultiplier !== profile.settings.stepMultiplier ||
                    nextProfile.settings.targetFPS !== profile.settings.targetFPS;

                if (profileChanged) {
                    requestRebuild();
                    return;
                }

                profile = nextProfile;
                syncSize();
                material.uniforms.uResolution.value.copy(size);
                renderFrame();
            }, 150);
        };

        const onContextLost = (event) => {
            if (isDestroyed) {
                return;
            }

            event.preventDefault();
            mountFallback(container);
            requestRebuild();
        };

        const onPageHide = () => {
            destroy();
        };
        const mediaQueries = [
            window.matchMedia("(max-width: 860px)"),
            window.matchMedia("(pointer: coarse)")
        ];
        removeMediaListeners = mediaQueries.map((queryList) => addMediaListener(queryList, onResize));
        renderer.domElement.addEventListener("webglcontextlost", onContextLost, false);
        window.addEventListener("resize", onResize, { passive: true });
        window.addEventListener("orientationchange", onResize, { passive: true });
        window.visualViewport?.addEventListener("resize", onResize, { passive: true });
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pagehide", onPageHide, { once: true });

        if ("ResizeObserver" in window) {
            resizeObserver = new ResizeObserver(onResize);
            resizeObserver.observe(container);
        }

        renderFrame();
        rafId = window.requestAnimationFrame(animate);

        return { destroy };
    }

    async function bootLightPillar(options = {}) {
        const currentBootToken = ++bootToken;

        if (activeInstance) {
            activeInstance.destroy();
            activeInstance = null;
        }

        const instance = await createLightPillar(options, currentBootToken);

        if (currentBootToken !== bootToken) {
            if (instance) {
                instance.destroy();
            }

            return;
        }

        activeInstance = instance;
    }

    window.addEventListener("pageshow", (event) => {
        if (event.persisted || !activeInstance) {
            bootLightPillar();
        }
    });

    bootLightPillar();
})();
