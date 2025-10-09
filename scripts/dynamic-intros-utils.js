/**
 * Dynamic Actor Intros Utilities Module
 * Contains utility functions used across the module
 */

import { logInfo, logDebug, logError, logWarning } from './dynamic-intros-logging.js';

// Constants
export const DAI_ID = "dynamic-actor-intros";
export const AVAILABLE_FONTS = [];
export const MACRO_DIRECTORY = "Dynamic Intros";

/**
 * Auto-pupulate AVAILABLE_FONTS with all available fonts found in the font directory.
 */
export async function getAvailableFonts() {
    AVAILABLE_FONTS.length = 0;
    const defaultFontDir = `modules/${DAI_ID}/fonts`

    const userFontDir = game.settings.get(DAI_ID, "userFontDir") || null;

    async function scanFolder(folder) {
	try {
	    const result = await FilePicker.browse("data", folder);
	    for (const file of result.files) {
		const relativePath = file.replace(`${folder}/`,"");
		const decoded = decodeURIComponent(relativePath);
		const match = decoded.match("^([^\/]+)\.(ttf|otf|woff2?)$");
		if (match) {
		    AVAILABLE_FONTS.push({
			name: match[1],
			path: file
		    });
		} else logInfo(`File ${decoded} does not match Regular Expression.`);
	    }
	} catch (err) {
	    logWarning("Failed to load fonts:", err);
    	}
    }

    await scanFolder(defaultFontDir);
    if (userFontDir) await scanFolder(userFontDir);

    logInfo("Fonts Found:", AVAILABLE_FONTS);

    // Refresh settings dropdown after fonts load
    refreshDefaultFontChoices();
    await injectFonts();
    logInfo("Fonts Injected.");
}

/**
 * Handle font injection
 */
async function injectFonts() {
    if (!AVAILABLE_FONTS.length) await getAvailableFonts();

    for (const f of AVAILABLE_FONTS) {
        const font = new FontFace(f.name, `url(${f.path})`);
        await font.load();        // Wait for font to load
        document.fonts.add(font); // Make it available globally
        logDebug(`Loaded font: ${f.name}`);
    }
    logInfo("All fonts loaded and ready for use.");
}

/**
 * This function handles refreshing all Font Choices when a new font is added/removed from the fonts folder
 */
function refreshDefaultFontChoices() {
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

export function registerHooks() {
    Hooks.on("deleteFolder", async (folder) => {
	if (folder?.name === MACRO_DIRECTORY && folder?.type === "Macro") {
	    logWarning(`Macro folder "${MACRO_DIRECTORY}" was deleted. Recreating...`);
	    Folder.create({
		name: MACRO_DIRECTORY,
		type: "Macro",
		parent: null
	    }).then(newFolder => {
		game.dynamicActorIntrosMacroFolder = newFolder.id;
		logInfo(`Recreated macro folder "${MACRO_DIRECTORY}"`);
	    });
	    ui.notifications.info(`"${MACRO_DIRECTORY}" folder deleted. It will be recreated automatically if needed.`);
	}
    });
}