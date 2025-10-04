/**
 * Dynamic Actor Intros Entry Point
 */

import { init } from './dynamic-intros-core.js';
// import { registerKeybindings } from './yakuza-settings.js';
import { logInfo, logDebug, logError, logWarning } from './dynamic-intros-logging.js';

// Module initialization state
// let i18nInitialized = false;
let moduleInitialized = false;

logInfo("Entry module loaded");

// Initialize when Foundry core is ready
Hooks.once("init", () => {
    logDebug("init hook triggered");

    // Set up context menu hooks early
    setupActorContextMenu();
    logInfo("Actor Context Menu Added.");
    setupTokenContextMenu();
    logInfo("Token Context Menu Added.");
});

// Register keybindings during setup
Hooks.once("setup", () => {
    logDebug("setup hook triggered");
    // registerKeybindings();
});

// Initialize the module when ready
Hooks.once("ready", () => {
    logDebug("ready hook triggered");

    // If i18n is already initialized, initialize the module now
    if (!moduleInitialized) {
        initializeModule();
    }
});

/**
 * Handle showing an intro (socket handler)
 */
function setupActorContextMenu() {
    logDebug("Setting up context menu for actors");

    Hooks.on("getActorDirectoryEntryContext", (html, options) => {
        if (!game.user.isGM) return; // Only GMs can trigger intros

        options.push({
            name: "Dynamic Actor Intro", // You can localize later if you wish
            icon: '<i class="fas fa-bomb"></i>',
            condition: li => !!li.data("documentId"),
            callback: li => {
                const id = li.data("documentId");
                const actor = game.actors.get(id);

                if (!actor) {
                    logError("Actor not found for ID:", id);
                    return ui.notifications.error("Actor not found.");
                }

                if (window.DynamicActorIntros?.triggerActorIntro) {
                    window.DynamicActorIntros.triggerActorIntro(actor);
                } else {
                    logError("DynamicActorIntros API not available");
                    ui.notifications.error("Dynamic Actor Intros API not available.");
                }
            }
        });
    });
}

/**
 * Initialize the module after ready hook has fired
 */
async function initializeModule() {
    if (moduleInitialized) return;
    moduleInitialized = true;

    // Initialize the module
    await init();

    logInfo("Module initialization complete");
}