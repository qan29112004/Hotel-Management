const { keyframes } = require("@angular/animations");
const path = require("path");
// const DefaultColors = require('tailwindcss/DefaultColors');
const DefaultColors = require("./configs/theme.config").default;
const defaultTheme = require("tailwindcss/defaultTheme");
const generatePalette = require(path.resolve(
    __dirname,
    "src/@fuse/tailwind/utils/generate-palette"
));

/**
 * Custom palettes
 *
 * Uses the generatePalette helper method to generate
 * Tailwind-like color palettes automatically
 */
const customPalettes = {
    brand: generatePalette("#2196F3"),
};

/**
 * Themes
 */
const themes = {
    // Default theme is required for theming system to work correctly!
    default: {
        primary: {
            ...DefaultColors.indigo,
            DEFAULT: DefaultColors.black,
        },
        accent: {
            ...DefaultColors.slate,
            DEFAULT: DefaultColors.slate[800],
        },
        warn: {
            ...DefaultColors.red,
            DEFAULT: DefaultColors.red[600],
        },
        "on-warn": {
            500: DefaultColors.red["50"],
        },
        title: {
            DEFAULT: DefaultColors.stronger,
        },
        normal: {
            DEFAULT: DefaultColors.gray["normal"],
        },
    },

    // Rest of the themes will use the 'default' as the base
    // theme and will extend it with their given configuration.
    brand: {
        primary: customPalettes.brand,
    },
    teal: {
        primary: {
            ...DefaultColors.teal,
            DEFAULT: DefaultColors.teal[600],
        },
    },
    rose: {
        primary: DefaultColors.rose,
    },
    purple: {
        primary: {
            ...DefaultColors.purple,
            DEFAULT: DefaultColors.purple[600],
        },
    },
    amber: {
        primary: DefaultColors.amber,
    },
};

/**
 * Tailwind configuration
 */
const config = {
    darkMode: "class",
    content: ["./src/**/*.{html,scss,ts}"],
    important: true,

    theme: {
        fontSize: {
            xs: "0.5625rem", // ↓ từ 0.625
            sm: "0.6875rem", // ↓ từ 0.75
            md: "0.75rem", // ↓ từ 0.8125
            base: "0.8125rem", // ↓ từ 0.875
            lg: "0.9375rem", // ↓ từ 1
            xl: "1rem", // ↓ từ 1.125
            "2xl": "1.125rem", // ↓ từ 1.25
            "3xl": "1.375rem", // ↓ từ 1.5
            "4xl": "1.875rem", // ↓ từ 2
            "5xl": "2rem", // ↓ từ 2.25
            "6xl": "2.25rem", // ↓ từ 2.5
            "7xl": "2.75rem", // ↓ từ 3
            "8xl": "3.5rem", // ↓ từ 4
            "9xl": "5rem", // ↓ từ 6
            "10xl": "7rem", // ↓ từ 8
        },

        screens: {
            sm: "600px",
            md: "960px",
            lg: "1280px",
            xl: "1440px",
        },
        extend: {
            animation: {
                "spin-slow": "spin 3s linear infinite",
                "slide-up": "slide-up 0.3s ease-out forwards",
                wave: "wave 1s ease-in-out infinite",
            },
            keyframes: {
                wave: {
                    "0%, 100%": { height: "20%" },
                    "50%": { height: "100%" },
                },
            },
            DefaultColors: {
                gray: DefaultColors.slate,
            },
            flex: {
                0: "0 0 auto",
            },
            fontFamily: {
                sans: `"Inter var", ${defaultTheme.fontFamily.sans.join(",")}`,
                mono: `"IBM Plex Mono", ${defaultTheme.fontFamily.mono.join(
                    ","
                )}`,
                lexend_deca: ["Lexend Deca", "sans-serif"],
                charm: ['"Charm"', 'cursive'],
                classy: ['"StayClassy"', 'cursive'],
                avenir: ['"Avenir"', 'cursive'],
                clearface: ['"Clearface"','cursive'],
                parisienne: ["Parisienne", "sans-serif"]
            },
            opacity: {
                12: "0.12",
                38: "0.38",
                87: "0.87",
            },
            rotate: {
                "-270": "270deg",
                15: "15deg",
                30: "30deg",
                60: "60deg",
                270: "270deg",
            },
            scale: {
                "-1": "-1",
            },
            zIndex: {
                "-1": -1,
                49: 49,
                60: 60,
                70: 70,
                80: 80,
                90: 90,
                99: 99,
                999: 999,
                9999: 9999,
                99999: 99999,
            },
            spacing: {
                13: "3.25rem",
                15: "3.75rem",
                18: "4.5rem",
                22: "5.5rem",
                26: "6.5rem",
                30: "7.5rem",
                50: "12.5rem",
                90: "22.5rem",

                // Bigger values
                100: "25rem",
                120: "30rem",
                128: "32rem",
                140: "35rem",
                160: "40rem",
                180: "45rem",
                192: "48rem",
                200: "50rem",
                240: "60rem",
                256: "64rem",
                280: "70rem",
                320: "80rem",
                360: "90rem",
                400: "100rem",
                480: "120rem",

                // Fractional values
                "1/2": "50%",
                "1/3": "33.333333%",
                "2/3": "66.666667%",
                "1/4": "25%",
                "2/4": "50%",
                "3/4": "75%",
            },
            height: {
                "table-body-15": "calc(100vh - 15rem)",
                "table-body-16": "calc(100vh - 16rem)",
                "table-body-17": "calc(100vh - 17rem)",
                "table-body-18": "calc(100vh - 18rem)",
                "table-body-19": "calc(100vh - 19rem)",
                "table-body-20": "calc(100vh - 20rem)",
                "table-body-21": "calc(100vh - 21rem)",
                "table-body-22": "calc(100vh - 22rem)",
                "table-body-23": "calc(100vh - 23rem)",
                "table-body-24": "calc(100vh - 24rem)",
                "table-body-25": "calc(100vh - 25rem)",
            },
            minHeight: ({ theme }) => ({
                ...theme("spacing"),
            }),
            maxHeight: {
                none: "none",
            },
            minWidth: ({ theme }) => ({
                ...theme("spacing"),
                screen: "100vw",
            }),
            maxWidth: ({ theme }) => ({
                ...theme("spacing"),
                screen: "100vw",
            }),
            transitionDuration: {
                400: "400ms",
            },
            transitionTimingFunction: {
                drawer: "cubic-bezier(0.25, 0.8, 0.25, 1)",
            },

            // @tailwindcss/typography
            typography: ({ theme }) => ({
                DEFAULT: {
                    css: {
                        color: "var(--fuse-text-default)",
                        '[class~="lead"]': {
                            color: "var(--fuse-text-secondary)",
                        },
                        a: {
                            color: "var(--fuse-primary-500)",
                        },
                        strong: {
                            color: "var(--fuse-text-default)",
                        },
                        "ol > li::before": {
                            color: "var(--fuse-text-secondary)",
                        },
                        "ul > li::before": {
                            backgroundColor: "var(--fuse-text-hint)",
                        },
                        hr: {
                            borderColor: "var(--fuse-border)",
                        },
                        blockquote: {
                            color: "var(--fuse-text-default)",
                            borderLeftColor: "var(--fuse-border)",
                        },
                        h1: {
                            color: "var(--fuse-text-default)",
                        },
                        h2: {
                            color: "var(--fuse-text-default)",
                        },
                        h3: {
                            color: "var(--fuse-text-default)",
                        },
                        h4: {
                            color: "var(--fuse-text-default)",
                        },
                        "figure figcaption": {
                            color: "var(--fuse-text-secondary)",
                        },
                        code: {
                            color: "var(--fuse-text-default)",
                            fontWeight: "500",
                        },
                        "a code": {
                            color: "var(--fuse-primary)",
                        },
                        pre: {
                            color: theme("DefaultColors.white"),
                            backgroundColor: theme("DefaultColors.gray.800"),
                        },
                        thead: {
                            color: "var(--fuse-text-default)",
                            borderBottomColor: "var(--fuse-border)",
                        },
                        "tbody tr": {
                            borderBottomColor: "var(--fuse-border)",
                        },
                        'ol[type="A" s]': false,
                        'ol[type="a" s]': false,
                        'ol[type="I" s]': false,
                        'ol[type="i" s]': false,
                    },
                },
                sm: {
                    css: {
                        code: {
                            fontSize: "1em",
                        },
                        pre: {
                            fontSize: "1em",
                        },
                        table: {
                            fontSize: "1em",
                        },
                    },
                },
            }),
        },
    },
    corePlugins: {
        appearance: false,
        container: false,
        float: false,
        clear: false,
        placeholderColor: false,
        placeholderOpacity: false,
        verticalAlign: false,
    },
    plugins: [
        // Fuse - Tailwind plugins
        require(path.resolve(
            __dirname,
            "src/@fuse/tailwind/plugins/utilities"
        )),
        require(path.resolve(
            __dirname,
            "src/@fuse/tailwind/plugins/icon-size"
        )),
        require(path.resolve(__dirname, "src/@fuse/tailwind/plugins/theming"))({
            themes,
        }),

        // Other third party and/or custom plugins
        require("@tailwindcss/typography")({ modifiers: ["sm", "lg"] }),
    ],
};

module.exports = config;
