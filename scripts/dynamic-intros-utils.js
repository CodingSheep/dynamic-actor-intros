/**
 * Dynamic Actor Intros Utilities Module
 * Contains utility functions used across the module
 */

import { logInfo, logDebug, logError, logWarning } from './dynamic-intros-logging.js';

// Constants
export const DAI_ID = "dynamic-actor-intros";

export const AVAILABLE_FONTS = [];

export async function getAvailableFonts() {
    const fontDir = `modules/${DAI_ID}/fonts`

    try {
        const result = await FilePicker.browse("data", fontDir);
        for (const file of result.files) {
            const relativePath = file.replace(`${fontDir}/`, "");
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
    } catch (err) {
        logWarning("Failed to load fonts:", err);
    }
}