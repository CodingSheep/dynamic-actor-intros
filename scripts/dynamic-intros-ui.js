/**
 * Dynamic Actor Intros UI Module
 * Handles displaying actor intros with fade-in/out animations
 */

import { logDebug, logInfo, logError, logWarning } from './dynamic-intros-logging.js';
import { DAI_ID } from './dynamic-intros-utils.js';

/**
 * Build the text elements for the intro overlay
 * @param {string} title - The main title
 * @param {string} font - The font to be used
 * @param {string} subtitle1 - The first subtitle
 * @param {string} subtitle2 - The second subtitle
 * @param {string} textColor - The text color
 * @param {string} textShadow - The text shadow color
 * @returns {string} HTML string for the text elements
 */
function buildTextElements(title, font, subtitle1 = null, subtitle2 = null, textColor = "#ad0a0a", textShadow = "#ffffff") {
    const shadow = `2px 2px 0 ${textShadow},
		    -2px -2px 0 ${textShadow},
		    2px -2px 0 ${textShadow},
		    -2px 2px 0 ${textShadow}`;

    logDebug(`Building text elements: title="${title}", font="${font}", subtitle1="${subtitle1}", subtitle2="${subtitle2}", textColor="${textColor}", textShadow="${textShadow}"`);

    return `
        <div class="dynamic-intro-text-wrapper" style="font-family: '${font}', sans-serif;">
            <div class="dynamic-intro-text dynamic-title" style="color: ${textColor}; text-shadow: ${shadow};">${title}</div>
            ${subtitle1 ? `<div class="dynamic-intro-text dynamic-subtitle" style="color: ${textColor}; text-shadow: ${shadow};">${subtitle1}</div>` : ''}
            ${subtitle2 ? `<div class="dynamic-intro-text dynamic-subtitle" style="color: ${textColor}; text-shadow: ${shadow};">${subtitle2}</div>` : ''}
        </div>
    `;
}

/**
 * Animate the intro elements
 * @returns {Promise<void>} Promise that resolves when animation is complete
 */
async function animateElements() {
    logDebug("Starting animation sequence");
    let skip = false;
    const overlay = $("#dynamic-intro-overlay");
    const image = overlay.find(".dynamic-intro-image");

    overlay.one("click", () => {
        logDebug("Animation skipped by user click");
        skip = true;
        $(".dynamic-title, .dynamic-subtitle").stop(true, true).show();
        image.addClass("dynamic-intro-filtered");
    });

    await new Promise(r => setTimeout(r, skip ? 0 : 300));
    logDebug("Adding filtered effect to image");
    image.addClass("dynamic-intro-filtered");

    logDebug("Showing title");
    $(".dynamic-title").addClass("show");
    await new Promise(r => setTimeout(r, skip ? 0 : 1000));
    logDebug("Showing subtitles");
    $(".dynamic-subtitle").each((i, el) => {
        $(el).delay(skip ? 0 : 300 * i).addClass("show");
    });
    logDebug("Animation sequence complete");
}

/**
 * Show the intro overlay
 * @param {Object} introData - Data for the intro (name, img, title, font, subtitle1, subtitle2, textColor, textShadow)
 * @returns {Promise<void>} Promise that resolves when intro is shown
 */
export async function showDynamicIntro(introData) {
    logDebug("Showing dynamic intro with data:", introData);
    $("#dynamic-intro-overlay").remove();
    
    // Create overlay DOM structure
    logDebug("Creating overlay DOM structure");
    const overlay = $(`
        <div id="dynamic-intro-overlay" class="dynamic-intro-overlay" style="opacity: 0;">
            <div class="dynamic-image-container">
                <img src="${introData.img}" class="dynamic-intro-image" style="visibility: hidden;">
            </div>
            ${buildTextElements(introData.title, introData.font,
        introData.subtitle1, introData.subtitle2,
        introData.textColor, introData.textShadow)}
        </div>
    `);

    overlay.appendTo(document.body);

    // Make image visible after preloading
    const img = overlay.find(".dynamic-intro-image")[0];
    $(img).css("visibility", "visible");

    // Fade in the overlay
    overlay.css("opacity", "");

    await animateElements();

    // Auto-fade after a time defined in the module settings
    const fadeOutSeconds = game.settings.get(DAI_ID, "fadeOutSeconds") || 5;
    const fadeOutMs = fadeOutSeconds * 1000;

    setTimeout(() => {
        logDebug("Auto-fading dynamic intro after 5 seconds");
        overlay.fadeOut(500, () => overlay.remove());
    }, fadeOutMs);
    logDebug("Dynamic intro display setup complete");
}