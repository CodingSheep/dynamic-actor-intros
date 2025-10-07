/**
 * Dynamic Actor Intros Settings
 * Registers module settings in FoundryVTT
 */

import { logInfo, logDebug, logError, logWarning } from './dynamic-intros-logging.js';
import { DAI_ID, AVAILABLE_FONTS, getAvailableFonts } from './dynamic-intros-utils.js';

/**
 * Register all module settings
 */
export function registerSettings() {
    logDebug("Registering all settings");

    registerFadeOutTimer();
    registerDefaultFontFamily();
    registerDefaultTextColor();
    registerDefaultShadowColor();

    logDebug("All settings registered.");
}

/**
 * Register the Fade Out Time (in seconds)
 */
export function registerFadeOutTimer() {
    // Fade-out timer slider (default 5 seconds, min 3, max 5)
    game.settings.register(DAI_ID, "fadeOutSeconds", {
        name: "Fade-out Duration",
        hint: "The number of seconds the Dynamic Intro remains visible before automatically fading out.",
        scope: "world",      // "world" so all users use the same setting
        config: true,        // Show in the module settings tab
        type: Number,
        default: 5,
        range: {
            min: 3,
            max: 5,
            step: 1
        },
        onChange: value => {
            logDebug(`Fade-out timer updated to ${value} seconds`);
        }
    });
}

/**
 * Register the Default Font to be used
 */
export function registerDefaultFontFamily() {

    const fontOptions = {};
    for (const font of AVAILABLE_FONTS) {
        fontOptions[font.name] = font.name;
    }

    // Set Default Font
    game.settings.register(DAI_ID, "defaultFontFamily", {
        name: "Default Font",
        hint: "Sets the default font family for Dynamic Intros.",
        scope: "world",      // "world" so all users use the same setting
        config: true,        // Show in the module settings tab
        type: String,
        default: AVAILABLE_FONTS[0]?.name,
        onChange: value => {
            logDebug(`Default Font changed to ${value}`);
        }
    });
}

/**
 * Register the Default Text Color
 */
export function registerDefaultTextColor() {
    // Set Default Text Color
    game.settings.register(DAI_ID, "defaultTextColor", {
        name: "Default Text Color",
        hint: "The default color used for intro text when no color is chosen. (Hex format)",
        scope: "world",      // "world" so all users use the same setting
        config: true,        // Show in the module settings tab
        type: String,
        default: "#ad0a0a",
        onChange: value => {
            logDebug(`Default text color changed to ${value}`);
        }
    });
}

/**
 * Register the Default Text Shadow Color
 */
export function registerDefaultShadowColor() {
    // Set Default Text Color
    game.settings.register(DAI_ID, "defaultShadowColor", {
        name: "Default Text Shadow Color",
        hint: "The default color used for intro text shadows when no color is chosen. (Hex format)",
        scope: "world",      // "world" so all users use the same setting
        config: true,        // Show in the module settings tab
        type: String,
        default: "#ffffff",
        onChange: value => {
            logDebug(`Default text shadow color changed to ${value}`);
        },
    });
}

/**
 * This function handles refreshing all Font Choices when a new font is added/removed from the fonts folder
 */
export function refreshDefaultFontChoices() {
    const setting = game.settings.settings.get(`${DAI_ID}.defaultFontFamily`);
    if (!setting) {
        logInfo("Setting does not exist");
        return;
    }

    const newChoices = {};
    for (const font of AVAILABLE_FONTS) {
        newChoices[font.name] = font.name;
    }

    // Replace the choices object
    setting.choices = newChoices;

    // Update the settings UI if it's open
    const form = document.querySelector(`select[name="${DAI_ID}.defaultFontFamily"]`);
    if (form) {
        form.innerHTML = Object.entries(newChoices)
            .map(([k, v]) => `<option value="${k}">${v}</option>`)
            .join("");
    } else logDebug("No form. If this is seen before the Refresh Fonts button has been pressed, you can safely ignore this message.");

    logDebug("Font choices refreshed:", newChoices);
}

/**
 * This adds the Font Refresh Button at the bottom of the settings page.
 */
export function addFontRefreshButton() {
    Hooks.on("renderSettingsConfig", (app, html, data) => {
        // Only add the button once per render
        if (html.find(`#${DAI_ID}-refresh-fonts`).length) return;

        const button = $(`
	    <button type="button" id="${DAI_ID}-refresh-fonts" style="margin-top: 10px;">
		    <i class="fa fa-refresh"></i> Refresh Available Fonts
	    </button>
	    `);

        // When clicked, re-scan fonts and refresh settings
        button.on("click", async () => {
            logInfo("Refreshing available fonts...");
            button.prop("disabled", true).text("Refreshing...");
            await getAvailableFonts(); // This calls refreshDefaultFontChoices() internally
            ui.notifications.info("Dynamic Actor Intros: Fonts list refreshed!");
            button.prop("disabled", false).text("Refresh Available Fonts");
        });

        // Insert the button at the end of this module's section
        const section = html.find(`section[data-category="${DAI_ID}"]`);
        if (section.length) {
            section.append(button);
            logInfo("Added 'Refresh Fonts' button to settings panel.");
        } else logDebug("Section not found.");
    });
}