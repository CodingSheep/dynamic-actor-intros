/**
 * Dynamic Actor Intros Entry Point
 */

import { init } from './dynamic-intros-core.js';
import { logInfo, logDebug, logError, logWarning } from './dynamic-intros-logging.js';

// Module initialization state
let moduleInitialized = false;

logInfo("Entry module loaded");

// Initialize when Foundry core is ready
Hooks.once("init", () => {
    logDebug("init hook triggered");

    // Set up context menu hooks early
    setupActorContextMenu();
    logInfo("Actor Context Menu Added.");

    // I'm keeping this here for the purpose of eventually adding this option to an existing token on the field.
    //setupTokenContextMenu();
    //logInfo("Token Context Menu Added.");
});

// Legacy from Yakuza-fy, but if I add keybindings, it'll be good to have this hook here.
// Register keybindings during setup
Hooks.once("setup", () => {
    logDebug("setup hook triggered");
    // registerKeybindings();
});

// Initialize the module when ready
Hooks.once("ready", () => {
    logDebug("ready hook triggered");

    // Legacy check from Yakuza-fy as that has Localization support. I'll keep it just in case I add support as well.
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