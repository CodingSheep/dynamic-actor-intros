/**
 * Dynamic Actor Intros Core Module
 * Main functionality and API integration
 */

import { DAI_ID } from './dynamic-intros-utils.js';
import { logInfo, logDebug, logError, logWarning } from './dynamic-intros-logging.js';
import { showDynamicIntro } from './dynamic-intros-ui.js';
import { registerSettings } from './dynamic-intros-settings.js';

// Socket instance for communication
let socket;

/**
 * Initialize the module
 */
export async function init() {
    logDebug("Initializing module");

    // Avoid double initialization
    if (game.modules.get(DAI_ID).api) {
        logDebug("Module already initialized, skipping");
        return;
    }
    if (!socketlib) {
        logError("Socketlib not found, cannot initialize");
        throw new Error("Dynamic Actor Intros requires socketlib");
    }
    logDebug("Socketlib found");

    // Register settings before using them
    registerSettings();

    logInfo(`Initializing for Foundry v${game.version ? Number(game.version.split('.')[0]) : 12}`);

    // Initialize socket
    logDebug("Registering socket");
    socket = socketlib.registerModule(DAI_ID);
    socket.register("showDynamicIntro", handleShowDynamicIntro);
    logDebug("Socket handlers registered");

    // Create global API access
    logDebug("Exposing global API");
    window.DynamicActorIntros = {
        triggerActorIntro
    };

    // Expose API
    logDebug("Exposing module API");
    game.modules.get(DAI_ID).api = {
        triggerActorIntro
    };
    logDebug("Core module initialization complete");
}

/**
 * Handle showing an intro (socket handler)
 * @param {Object} actorData - Data for the intro
 */
async function handleShowDynamicIntro(actorData) {
    logDebug("Socket handler: showIntro received", actorData);
    await showDynamicIntro(actorData);
    logDebug("Intro display completed via socket");
}

/**
 * Trigger an intro with the actor
 * @param {Object} actor - Actor to extract data for the intro
 */
export function triggerActorIntro(actor) {
    if (!game.user.isGM) {
        ui.notifications.warn("Only the GM can trigger dynamic intros.");
        return;
    }

    const actorData = {
        name: actor.name,
        img: actor.img,
        title: actor.name,
        subtitle1: "",
        subtitle2: ""
    };

    // Open a Dialog for GM to edit title/subtitles
    new Dialog({
        title: `Dynamic Intro for ${actor.name}`,
        content: `
            <form>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" name="title" value="${actorData.title}">
                </div>
                <div class="form-group">
                    <label>Subtitle 1</label>
                    <input type="text" name="subtitle1" value="">
                </div>
                <div class="form-group">
                    <label>Subtitle 2</label>
                    <input type="text" name="subtitle2" value="">
                </div>
            </form>
        `,
        buttons: {
            ok: {
                icon: '<i class="fas fa-check"></i>',
                label: "Show Intro",
                callback: html => {
                    // Collect the inputs
                    actorData.title = html.find('[name="title"]').val();
                    actorData.subtitle1 = html.find('[name="subtitle1"]').val();
                    actorData.subtitle2 = html.find('[name="subtitle2"]').val();

                    // Broadcast to all clients
                    logInfo("Executing showIntro for all users");
                    socket.executeForEveryone("showDynamicIntro", actorData);
                    logInfo("Intro triggered for all users");
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "ok"
    }).render(true);
}