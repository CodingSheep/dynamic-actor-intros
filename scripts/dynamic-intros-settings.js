/**
 * Dynamic Actor Intros Settings
 * Registers module settings in FoundryVTT
 */

import { DAI_ID } from './dynamic-intros-utils.js';
import { logInfo, logDebug, logError, logWarning } from './dynamic-intros-logging.js';

export function registerSettings() {
    logDebug("Registering all settings");

    registerFadeOutTimer();

    logDebug("All settings registered.");
}

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
            min: 2,
            max: 8,
            step: 1
        },
        onChange: value => {
            logDebug(`Fade-out timer updated to ${value} seconds`);
        }
    });
}
