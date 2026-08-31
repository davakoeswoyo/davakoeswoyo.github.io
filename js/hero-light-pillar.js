(function () {
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
                    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
                    precision: "mediump",
                    stepMultiplier: 1.2,
                    targetFPS: 45
                },
                high: {
                    iterations: 64,
                    waveIterations: 3,
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
    }

    function unmountFallback(container) {
        const fallback = container.querySelector(".light-pillar-fallback");
        if (fallback) {
            container.removeChild(fallback);
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

    function createContext(canvas, preferHighPerformance) {
        const attributes = {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: preferHighPerformance ? "high-performance" : "low-power",
            failIfMajorPerformanceCaveat: false
        };

        return (
            canvas.getContext("webgl", attributes) ||
            canvas.getContext("experimental-webgl", attributes)
        );
    }

    function compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function createProgram(gl, vertexSource, fragmentSource) {
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        // The shaders are reference-counted by the program once attached.
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    function parseColor(hex) {
        const value = String(hex).replace("#", "");
        const full = value.length === 3
            ? value.split("").map((char) => char + char).join("")
            : value;
        const int = parseInt(full, 16) || 0;
        // The original build fed three.js colors, which are linear-space floats.
        const toLinear = (channel) => {
            const normalized = channel / 255;
            return normalized < 0.04045
                ? normalized / 12.92
                : Math.pow((normalized + 0.055) / 1.055, 2.4);
        };

        return [
            toLinear((int >> 16) & 255),
            toLinear((int >> 8) & 255),
            toLinear(int & 255)
        ];
    }

    function createLightPillar(options = {}, currentBootToken = 0) {
        const container = document.getElementById("hero-pillar");
        if (!container) {
            return null;
        }

        const config = { ...DEFAULTS, ...options };
        let profile = detectQuality(config.quality);

        Object.assign(container.style, { mixBlendMode: config.mixBlendMode });

        const canvas = document.createElement("canvas");
        const gl = createContext(canvas, profile.effectiveQuality === "high");

        if (!gl) {
            mountFallback(container);
            return null;
        }

        const vertexShaderSource = `
            attribute vec2 aPosition;
            varying vec2 vUv;

            void main() {
                vUv = aPosition * 0.5 + 0.5;
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
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

            // GLSL ES 1.00 has no tanh. Clamped so exp() cannot overflow to inf.
            vec3 tanhApprox(vec3 x) {
                vec3 e = exp(2.0 * clamp(x, -10.0, 10.0));
                return (e - 1.0) / (e + 1.0);
            }

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
                col = tanhApprox(col * uGlowAmount / widthNorm);
                col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;
                gl_FragColor = vec4(col * uIntensity, 1.0);
            }
        `;

        const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        if (!program) {
            mountFallback(container);
            return null;
        }

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "aPosition");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const uniform = (name) => gl.getUniformLocation(program, name);
        const uniforms = {
            time: uniform("uTime"),
            resolution: uniform("uResolution"),
            mouse: uniform("uMouse"),
            rotCos: uniform("uRotCos"),
            rotSin: uniform("uRotSin")
        };

        const pillarRotationRadians = (config.pillarRotation * Math.PI) / 180;
        const topColor = parseColor(config.topColor);
        const bottomColor = parseColor(config.bottomColor);
        const size = { width: 0, height: 0 };
        const mouse = { x: 0, y: 0 };

        gl.useProgram(program);
        // Constant for the lifetime of the program — set once, not per frame.
        gl.uniform3f(uniform("uTopColor"), topColor[0], topColor[1], topColor[2]);
        gl.uniform3f(uniform("uBottomColor"), bottomColor[0], bottomColor[1], bottomColor[2]);
        gl.uniform1f(uniform("uIntensity"), config.intensity);
        gl.uniform1i(uniform("uInteractive"), config.interactive ? 1 : 0);
        gl.uniform1f(uniform("uGlowAmount"), config.glowAmount);
        gl.uniform1f(uniform("uPillarWidth"), config.pillarWidth);
        gl.uniform1f(uniform("uPillarHeight"), config.pillarHeight);
        gl.uniform1f(uniform("uNoiseIntensity"), config.noiseIntensity);
        gl.uniform1f(uniform("uPillarRotCos"), Math.cos(pillarRotationRadians));
        gl.uniform1f(uniform("uPillarRotSin"), Math.sin(pillarRotationRadians));
        gl.uniform1f(uniform("uWaveSin"), Math.sin(0.4));
        gl.uniform1f(uniform("uWaveCos"), Math.cos(0.4));
        gl.clearColor(0, 0, 0, 0);

        function syncSize() {
            const width = Math.max(container.clientWidth || window.innerWidth, 1);
            const height = Math.max(container.clientHeight || window.innerHeight, 1);
            const ratio = profile.settings.pixelRatio;

            size.width = width;
            size.height = height;
            canvas.width = Math.floor(width * ratio);
            canvas.height = Math.floor(height * ratio);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(uniforms.resolution, width, height);
        }

        unmountFallback(container);
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.mixBlendMode = config.mixBlendMode;
        container.appendChild(canvas);
        syncSize();

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
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
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
            gl.uniform1f(uniforms.time, elapsed);
            gl.uniform1f(uniforms.rotCos, Math.cos(elapsed * 0.3));
            gl.uniform1f(uniforms.rotSin, Math.sin(elapsed * 0.3));
            gl.uniform2f(uniforms.mouse, mouse.x, mouse.y);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
            canvas.removeEventListener("webglcontextlost", onContextLost);

            if (config.interactive) {
                window.removeEventListener("pointermove", onPointerMove);
            }

            removeMediaListeners.forEach((removeListener) => removeListener());

            if (resizeObserver) {
                resizeObserver.disconnect();
            }

            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
            gl.getExtension("WEBGL_lose_context")?.loseContext();

            if (container.contains(canvas)) {
                container.removeChild(canvas);
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
        canvas.addEventListener("webglcontextlost", onContextLost, false);
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

    function bootLightPillar(options = {}) {
        const currentBootToken = ++bootToken;

        if (activeInstance) {
            activeInstance.destroy();
            activeInstance = null;
        }

        const instance = createLightPillar(options, currentBootToken);

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
