/**
 * Dynamic Actor Intros Utilities Module
 * Contains utility functions used across the module
 */

import { logInfo, logDebug, logError, logWarning } from './dynamic-intros-logging.js';
import { refreshDefaultFontChoices } from './dynamic-intros-settings.js';

// Constants
export const DAI_ID = "dynamic-actor-intros";
export const AVAILABLE_FONTS = [];

/**
 * Auto-pupulate AVAILABLE_FONTS with all available fonts found in the font directory.
 */
export async function getAvailableFonts() {
    AVAILABLE_FONTS.length = 0;
    const fontDir = `modules/${DAI_ID}/fonts`

    try {
        const result = await FilePicker.browse("data", fontDir);
        for (const file of result.files) {
	    const relativePath = file.replace(`${fontDir}/`,"");
	    const decoded = decodeURIComponent(relativePath);
            const match = decoded.match("^([^\/]+)\.(ttf|otf|woff2?)$");
            if (match) {
		AVAILABLE_FONTS.push({
		    name: match[1],
		    path: file
		});
	    }
	    else logInfo(`File ${decoded} does not match Regular Expression.`);
        }

        logInfo("Fonts Found:", AVAILABLE_FONTS);

        // Refresh settings dropdown after fonts load
        refreshDefaultFontChoices();
    } catch (err) {
        logWarning("Failed to load fonts:", err);
    }
}