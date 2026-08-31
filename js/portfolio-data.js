// Every project and game lives in one collection. `medium` decides which
// section renders it: "web" -> the website deck, "game" -> the games grid.
// descSections[0] doubles as the deck summary, so write it as a standalone
// opening paragraph. Adding an entry here is all that is needed - no markup.
window.portfolioData = {
    work: {
        dani: {
            medium: "web",
            name: "Coaching by Dani",
            num: "001",
            ghost: "DANI",
            eyebrow: "WordPress - Figma - Netherlands",
            title: `Coaching<br><em>by Dani</em>`,
            client: "Coaching by Dani",
            type: "Life coaching website",
            year: "2025 - 2026",
            stack: ["WordPress", "Figma", "PHP", "CSS", "Custom Theme"],
            liveUrl: "https://coachingbydani.nl",
            descSections: [
                {
                    body: [
                        `<strong>For Coaching by Dani</strong>, the goal was to create a warm and personal website that feels calm, trustworthy, and easy to navigate. The site was designed to clearly introduce Dani, explain her services, and make it simple for visitors to understand the value of her coaching and book a session.`,
                        `Coaching by Dani focuses on personal growth, finding direction, and creating more clarity in everyday life. Because of that, the website needed to do more than just present information. It had to reflect the same soft, approachable, and human tone that defines the practice itself.`,
                        `With a calm visual style, clear structure, and an easy-to-follow layout, the website now gives the brand a professional digital presence. Visitors can quickly get a complete picture of the services, the approach, and the personality behind the business.`
                    ]
                }
            ],
            roleSections: [
                {
                    body: `<strong>Web developer.</strong> Translated the design into a custom WordPress build, shaping layout, visual hierarchy, and front-end polish for a coaching-focused brand.`
                }
            ],
            screens: [
                { label: "Homepage", image: "assets/site-gallery/dani/01-home.webp" },
                { label: "Massages", image: "assets/site-gallery/dani/02-massages.webp" },
                { label: "Supplements", image: "assets/site-gallery/dani/03-supplementen.webp" }
            ],
            preview: { screenshotUrl: "assets/site-gallery/dani/01-home.webp" }
        },

        ascend: {
            medium: "web",
            name: "Ascend Marketing",
            num: "002",
            ghost: "ASCEND",
            eyebrow: "WordPress - Remote - Netherlands",
            title: `Ascend<br><em>Marketing</em>`,
            client: "Ascend Marketing",
            type: "Marketing agency website",
            year: "2025 - present",
            stack: [
                "WordPress",
                "UI/UX Design",
                "HTML",
                "CSS",
                "JavaScript",
                "Responsive Design",
                "Performance Optimization"
            ],
            liveUrl: "https://ascendmarketing.nl",
            heroImagePosition: "center 19%",
            descSections: [
                {
                    body: [
                        `Ascend Marketing required a professional online presence that would clearly communicate their services, showcase previous work, and convert visitors into qualified leads.`,
                        `The goal was to create a modern, scalable website that establishes trust, highlights expertise, and supports ongoing business growth through a clear and intuitive user experience.`
                    ]
                },
                {
                    title: "Approach",
                    body: [
                        `The website was designed around a conversion-focused user journey, ensuring visitors could quickly understand Ascend Marketing's services, explore case studies, and take action. A clean visual language, large typography, generous spacing, and a high-contrast aesthetic were used to create a professional agency presence while maintaining clarity and readability across all devices.`,
                        `Special attention was given to information hierarchy and navigation, allowing users to move seamlessly between service offerings, case studies, blog content, and contact opportunities. The structure was built to support future growth, making it easy to add new content, services, and marketing materials without requiring significant redevelopment.`
                    ]
                },
                {
                    title: "Challenges",
                    body: `One of the primary challenges was balancing visual impact with content-heavy sections. The website needed to communicate multiple service offerings, establish credibility through client work, and encourage inquiries without overwhelming visitors. This was addressed through modular content sections, consistent call-to-action placement, clear navigation patterns, and a responsive layout that adapts smoothly across desktop and mobile devices.`
                },
                {
                    title: "Solution",
                    body: [
                        `A custom WordPress website was designed and developed to provide a professional, scalable platform for Ascend Marketing. The site combines strong visual presentation with practical business functionality, creating a user experience focused on trust, clarity, and lead generation.`,
                        `Interactive elements and subtle animations were implemented to enhance engagement while maintaining a clean and professional appearance.`
                    ]
                },
                {
                    title: "Outcome",
                    body: `The final result provides Ascend Marketing with a modern digital platform that effectively communicates their services, showcases their expertise, and supports client acquisition efforts. Built with scalability in mind, the website enables future expansion through additional content, case studies, and service offerings while maintaining a consistent and professional user experience.`
                }
            ],
            roleSections: [
                {
                    title: "Responsibilities",
                    body: `<strong>Web designer and WordPress developer.</strong> Web design, UI/UX design, front-end development, WordPress development, content integration, performance optimization, and responsive implementation.`
                },
                {
                    title: "Key Features",
                    list: [
                        "Custom responsive website design",
                        "Service-focused landing pages",
                        "Animated statistics and counters",
                        "Partner and client showcase sections",
                        "Case study presentation system",
                        "Blog and content management functionality",
                        "Mobile navigation overlay",
                        "Contact and lead generation forms",
                        "Scroll-triggered interactions and animations",
                        "Search engine friendly site structure",
                        "Easily maintainable content architecture"
                    ]
                }
            ],
            screens: [
                { label: "Homepage", image: "assets/site-gallery/ascend/01-home.webp" },
                { label: "Services", image: "assets/site-gallery/ascend/02-services.webp" },
                { label: "Contact", image: "assets/site-gallery/ascend/03-contact.webp" }
            ],
            preview: { screenshotUrl: "assets/site-gallery/ascend/01-home.webp" }
        },

        flex: {
            medium: "web",
            name: "Flex Living Bali",
            num: "003",
            ghost: "FLEX",
            eyebrow: "WordPress - Figma - Bali, Indonesia",
            title: `Flex Living<br><em>Bali</em>`,
            client: "Flex Living Bali",
            type: "Co-living website",
            year: "2025",
            stack: ["WordPress", "Figma", "PHP", "CSS", "Custom Theme"],
            liveUrl: "https://flexlivingbali.com",
            descSections: [
                {
                    body: [
                        `<strong>For Flex Living Bali</strong>, the website was built to immediately communicate the atmosphere of the brand: calm, modern, and focused on comfortable long-stay living in Bali. The site brings together the living concept, available spaces, and the lifestyle around the brand in a way that feels clear, structured, and visually appealing.`,
                        `Flex Living Bali is aimed at people staying in Bali for a longer period and looking for a place that feels practical but still carries a strong identity. Because of that, the website needed to do more than list rooms or features. It also had to support the feeling of the brand through a clean layout, quiet visuals, and a browsing experience that naturally leads toward interest or booking.`,
                        `With this online presentation, Flex Living Bali now has a stronger professional foundation for showing the brand more clearly. Visitors can understand the concept at a glance, see what is being offered, and quickly get a sense of why it fits a modern Bali lifestyle.`
                    ]
                }
            ],
            roleSections: [
                {
                    body: `<strong>Web developer.</strong> Translated the visual direction into a WordPress site with a calm, structured layout and a clearer room-focused browsing experience.`
                }
            ],
            screens: [
                { label: "Homepage", image: "assets/site-gallery/flex/01-home.webp" },
                { label: "Rooms", image: "assets/site-gallery/flex/02-rooms.webp" },
                { label: "Contact", image: "assets/site-gallery/flex/03-contact.webp" }
            ],
            preview: { screenshotUrl: "assets/site-gallery/flex/01-home.webp" }
        },

        laia: {
            medium: "web",
            name: "Laia Cafe & Spa",
            num: "004",
            ghost: "LAIA",
            eyebrow: "WordPress - Figma - Bali, Indonesia",
            title: `Laia Cafe<br><em>& Spa</em>`,
            client: "Laia Cafe & Spa",
            type: "Brand website + Operations",
            year: "2025 - present",
            stack: ["WordPress", "Figma", "PHP", "CSS", "Custom Theme", "Booking Integration"],
            liveUrl: "https://laiabali.com",
            descSections: [
                {
                    body: [
                        `<strong>For Laia Cafe & Spa</strong>, the website was developed to bring together the brand experience of both Bali locations in a clear and stylish way. The site shows what Laia stands for: relaxation, atmosphere, and a blend of wellness and hospitality presented through a strong visual identity.`,
                        `Laia operates in Pecatu and Ungasan, combining spa, cafe, and a calm lifestyle feel within one recognisable brand. Because of that, the website needed to do more than simply present information. It also had to translate the feeling of the physical spaces into an online experience that feels warm, polished, and easy to explore.`,
                        `With a clear structure, refined visuals, and a logical flow between services, menus, and reservations, Laia now has a stronger digital foundation. The result gives both new and returning visitors a more complete and convincing impression of the brand.`
                    ]
                }
            ],
            roleSections: [
                {
                    body: `<strong>Owner and web developer.</strong> Designed and built the WordPress site, integrated the booking system, and run operations across both locations.`
                }
            ],
            screens: [
                { label: "Homepage", image: "assets/site-gallery/laia/01-home.webp" },
                { label: "Pecatu", image: "assets/site-gallery/laia/02-pecatu.webp" },
                { label: "Ungasan", image: "assets/site-gallery/laia/03-ungasan.webp" }
            ],
            preview: { screenshotUrl: "assets/site-gallery/laia/01-home.webp" }
        },

        vr: {
            medium: "game",
            name: "VR Vaccination Games",
            num: "G01",
            ghost: "VR",
            eyebrow: "Unity VR - Gaze-based - XR Lab, Netherlands",
            title: `VR Vaccination<br><em>Games</em>`,
            client: "XR Lab - Hanze University",
            type: "Serious Game - Healthcare VR",
            year: "2022 - 2023",
            stack: ["Unity 3D", "VR", "UX Research", "Serious Games", "Scrum", "Playtesting"],
            heroHtml: `<div style="background:#0a0e1a;width:100%;height:100%;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px"><div style="color:#6478ff;font-size:10px;letter-spacing:3px">VR VACCINATION GAME</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;width:100%;max-width:300px"><div style="background:#111320;border:1px solid rgba(100,120,255,.2);border-radius:8px;padding:14px;text-align:center"><div style="font-size:24px;margin-bottom:6px">&#129419;</div><div style="color:#c8d0ff;font-size:9px">Butterfly</div></div><div style="background:#111320;border:1px solid rgba(100,120,255,.2);border-radius:8px;padding:14px;text-align:center"><div style="font-size:24px;margin-bottom:6px">&#128032;</div><div style="color:#c8d0ff;font-size:9px">Fish Tank</div></div><div style="background:#111320;border:1px solid rgba(100,120,255,.2);border-radius:8px;padding:14px;text-align:center"><div style="font-size:24px;margin-bottom:6px">&#11088;</div><div style="color:#c8d0ff;font-size:9px">Stars</div></div></div></div>`,
            descSections: [
                {
                    body: `A set of <strong>6 Unity VR gaze-based minigames</strong> designed to help distract children during vaccinations. The experiences were built for healthcare settings, with simple interactions, low friction onboarding, and calming feedback loops tailored for young users.`
                }
            ],
            roleSections: [
                {
                    body: `<strong>Scrum Master of a 6-person team at XR Lab, Netherlands.</strong> Scheduled and conducted playtests with healthcare professionals, managed sprints, and translated user feedback directly into design and gameplay improvements.`
                }
            ],
            screens: [
                {
                    label: "Game selection screen",
                    html: `<div style="background:#0a0e1a;width:100%;height:100%;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px"><div style="color:#6478ff;font-size:9px;letter-spacing:3px">SELECT A GAME</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;width:100%"><div style="background:#111320;border:1px solid rgba(100,120,255,.15);border-radius:6px;padding:8px;text-align:center"><div style="font-size:16px;margin-bottom:3px">&#129419;</div><div style="color:#c8d0ff;font-size:8px">Butterfly</div><div style="color:#4a5080;font-size:7px">Easy</div></div><div style="background:#111320;border:1px solid rgba(100,120,255,.15);border-radius:6px;padding:8px;text-align:center"><div style="font-size:16px;margin-bottom:3px">&#128032;</div><div style="color:#c8d0ff;font-size:8px">Fish Tank</div><div style="color:#4a5080;font-size:7px">Medium</div></div><div style="background:#111320;border:1px solid rgba(100,120,255,.15);border-radius:6px;padding:8px;text-align:center"><div style="font-size:16px;margin-bottom:3px">&#128640;</div><div style="color:#c8d0ff;font-size:8px">Space</div><div style="color:#4a5080;font-size:7px">Hard</div></div></div></div>`
                },
                {
                    label: "In-game view",
                    html: `<div style="background:#0d1520;width:100%;height:100%;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,#1a2a40,#0d1520)"></div><div style="position:absolute;top:10px;left:12px;right:12px;display:flex;justify-content:space-between"><div style="background:rgba(100,120,255,.15);border:1px solid rgba(100,120,255,.2);border-radius:10px;padding:4px 10px;font-size:8px;color:#6478ff;font-family:sans-serif">Score: 12</div><div style="background:rgba(100,120,255,.15);border:1px solid rgba(100,120,255,.2);border-radius:10px;padding:4px 10px;font-size:8px;color:#c8d0ff;font-family:sans-serif">0:42</div></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:32px">&#129419;</div><div style="position:absolute;top:30%;left:25%;font-size:18px;opacity:.6">&#129419;</div><div style="position:absolute;top:60%;left:70%;font-size:14px;opacity:.4">&#129419;</div></div>`
                }
            ],
            preview: {
                label: "unity vr - xr lab",
                html: `<div style="background:#0a0e1a;width:100%;height:100%;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px"><div style="color:#6478ff;font-size:9px;letter-spacing:3px;margin-bottom:4px">VR GAME LOBBY</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;width:100%"><div style="background:#111320;border:1px solid rgba(100,120,255,.2);border-radius:6px;padding:10px;text-align:center"><div style="font-size:20px;margin-bottom:4px">&#129419;</div><div style="color:#c8d0ff;font-size:8px">Butterfly</div></div><div style="background:#111320;border:1px solid rgba(100,120,255,.2);border-radius:6px;padding:10px;text-align:center"><div style="font-size:20px;margin-bottom:4px">&#128032;</div><div style="color:#c8d0ff;font-size:8px">Fish Tank</div></div><div style="background:#111320;border:1px solid rgba(100,120,255,.2);border-radius:6px;padding:10px;text-align:center"><div style="font-size:20px;margin-bottom:4px">&#128640;</div><div style="color:#c8d0ff;font-size:8px">Space</div></div></div><div style="background:rgba(100,120,255,.1);border:1px solid rgba(100,120,255,.2);border-radius:20px;padding:5px 14px;font-size:9px;color:#6478ff;letter-spacing:1px">GAZE CONTROLLED</div></div>`
            }
        },

        ar: {
            medium: "game",
            name: "AR Story Builder",
            num: "G02",
            ghost: "AR",
            eyebrow: "Graduation Project - Unity 6 - XR Lab, Netherlands",
            title: `AR Story<br><em>Builder</em>`,
            client: "XR Lab - Hanze University of Applied Sciences",
            type: "Unity Package - AR Storytelling Tool",
            year: "2024 - 2025",
            stack: [
                "Unity 6",
                "C#",
                "AR Foundation",
                "Visual Scripting",
                "Tool Design",
                "Interaction Design",
                "UX Research",
                "Usability Testing",
                "Documentation"
            ],
            heroImage: "assets/game-gallery/ar-story-builder/01-story-map.webp",
            descSections: [
                {
                    body: [
                        `<strong>Graduation project for XR Lab at Hanze University of Applied Sciences.</strong> I designed and built a Unity package that helps students create interactive AR storybooks without having to build the tooling from scratch. The package combines a visual-scripting Story Maker, reusable interaction systems, AR scene setup, templates, example scenes, and onboarding so developers can structure branching pages, attach visuals, and bring stories into AR faster.`,
                        `The concept was shaped by desk research, interviews with Game Design and Game Technologies students, and multiple prototyping rounds. The final tool met the client's expectations and testers rated its ease of use and functionality between 7 and 9 out of 10, consistently valuing how much it streamlined the story-making process.`
                    ]
                }
            ],
            roleSections: [
                {
                    body: [
                        `<strong>Solo designer, researcher, and Unity developer.</strong> I defined the design requirements, interviewed target users, translated the findings into the concept, and built the full prototype in Unity and C#. My work included the visual-scripting Story Maker, page data flow with ScriptableObjects, a Story Viewer prefab, an interaction manager with reusable interaction classes, AR scene integration, end-user onboarding, tooltips, templates, example stories, and installation/documentation support.`,
                        `This project shows strengths in Unity tooling, AR Foundation integration, systems design, UX design, onboarding, research-driven iteration, and one-on-one usability testing.`
                    ]
                }
            ],
            screens: [
                {
                    label: "Story Maker graph",
                    image: "assets/game-gallery/ar-story-builder/02-story-graph.webp"
                },
                {
                    label: "Building blocks guide",
                    image: "assets/game-gallery/ar-story-builder/03-building-blocks.webp"
                },
                {
                    label: "Story viewer scene",
                    image: "assets/game-gallery/ar-story-builder/04-story-viewer-scene.webp"
                },
                {
                    label: "Example scene assets",
                    image: "assets/game-gallery/ar-story-builder/05-example-scene-assets.webp"
                }
            ],
            preview: {
                label: "unity 6 package - xr lab",
                screenshotUrl: "assets/game-gallery/ar-story-builder/04-story-viewer-scene.webp"
            }
        }
    }
};
