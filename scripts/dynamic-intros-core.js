/**
 * Dynamic Actor Intros Core Module
 * Main functionality and API integration
 */

import { logInfo, logDebug, logError, logWarning } from './dynamic-intros-logging.js';
import { registerSettings, addFontRefreshButton } from './dynamic-intros-settings.js';
import { showDynamicIntro } from './dynamic-intros-ui.js';
import { DAI_ID, AVAILABLE_FONTS, MACRO_DIRECTORY, getAvailableFonts, registerHooks } from './dynamic-intros-utils.js';

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
    addFontRefreshButton();

    logInfo(`Initializing for Foundry v${game.version ? Number(game.version.split('.')[0]) : 12}`);

    // Initialize socket
    logDebug("Registering socket");
    socket = socketlib.registerModule(DAI_ID);
    socket.register("showDynamicIntro", handleShowDynamicIntro);
    logDebug("Socket handlers registered");

    // Create global API access
    logDebug("Exposing global API");
    window.DynamicActorIntros = {
        triggerActorIntro,
        socket
    };

    // Expose API
    logDebug("Exposing module API");
    game.modules.get(DAI_ID).api = {
        triggerActorIntro
    };
    logDebug("Core module initialization complete");

    // Detect & Inject Fonts
    await getAvailableFonts();

    // Create Macro Directory Folder if it does not already exist.
    let folder = game.folders.getName(MACRO_DIRECTORY);
    if (!folder) {
        folder = await Folder.create({
            name: MACRO_DIRECTORY,
            type: "Macro",
            parent: null
        });
        logInfo(`Created new macro folder: "${MACRO_DIRECTORY}"`);
    } else logInfo(`Macro folder "${MACRO_DIRECTORY}" already exists.`);
    game.dynamicActorIntrosMacroFolder = folder.id;

    // Register Module Hooks
    registerHooks();
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
export async function triggerActorIntro(actor) {
    if (!game.user.isGM) {
        ui.notifications.warn("Only the GM can trigger dynamic intros.");
        return;
    }

    // Set Defaults
    const defaultFont = game.settings.get(DAI_ID, "defaultFontFamily");
    const defaultTextColor = game.settings.get(DAI_ID, "defaultTextColor");
    const defaultShadowColor = game.settings.get(DAI_ID, "defaultShadowColor");

    const actorData = {
        name: actor.name,
        img: actor.img,
        font: defaultFont,
        title: actor.name,
        subtitle1: "",
        subtitle2: "",
        textColor: defaultTextColor,
        textShadow: defaultShadowColor
    };

    // If an existing macro exists, then let's replace the default with that
    const macro = game.macros.find(m => m.name === `Dynamic Intro: ${actor.name}`);

    if (macro) {
        // This assumes your macro uses the variable definition as above
        const match = macro.command.match(/const actorData = (\{[\s\S]*?\});/);

        if (match) {
            const existingData = JSON.parse(match[1].replace(/([a-zA-Z0-9]+)\s*:/g, '"$1":'));

            // JSON-parseable format
            Object.assign(actorData, {
                title: existingData.title,
                subtitle1: existingData.subtitle1,
                subtitle2: existingData.subtitle2,
                font: existingData.font,
                textColor: existingData.textColor,
                textShadow: existingData.textShadow
            });
        }
    }

    // Default Form Format
    const getDialogContent = () => {
        const fontOptions = AVAILABLE_FONTS.map(f =>
            `<option value="${f.name}" style="font-family: '${f.name}', sans-serif;" ${f.name === actorData.font ? "selected" : ""}>${f.name}</option>`
        ).join("");

        return `
            <form>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" name="title" value="${actorData.title}">
                </div>
                <div class="form-group">
                    <label>Subtitle 1</label>
                    <input type="text" name="subtitle1" value="${actorData.subtitle1}">
                </div>
                <div class="form-group">
                    <label>Subtitle 2</label>
                    <input type="text" name="subtitle2" value="${actorData.subtitle2}">
                </div>
		        <div class="form-group">
                    <label>Text Color:</label>
                    <input type="color" name="textColor" value="${actorData.textColor}">
                </div>
		        <div class="form-group">
                    <label>Text Shadow Color:</label>
                    <input type="color" name="textShadow" value="${actorData.textShadow}">
                </div>
                <div class="form-group">
                    <label>Font Style:</label>
                    <select name="font">
                        ${fontOptions}
                    </select>
                </div>
            </form>
        `;
    }

    // Open a Dialog for GM to edit title/subtitles
    const introBox = new Dialog({
        title: `Dynamic Intro for ${actor.name}`,
        content: getDialogContent(),
        buttons: {
            save: {
                icon: '<i class="fas fa-check"></i>',
                label: "Save as Macro",
                callback: async html => {
                    // Collect the inputs
                    Object.assign(actorData, {
                        title: html.find('[name="title"]').val(),
                        subtitle1: html.find('[name="subtitle1"]').val(),
                        subtitle2: html.find('[name="subtitle2"]').val(),
                        font: html.find('[name="font"]').val(),
                        textColor: html.find('[name="textColor"]').val(),
                        textShadow: html.find('[name="textShadow"]').val(),
                    });

                    // Build the Macro Command String
                    const macroCommand = `
                    const actorData = ${JSON.stringify(actorData, null, 4)};
                    window.DynamicActorIntros.socket.executeForEveryone("showDynamicIntro", actorData);
                    `;

                    // Generate Macro Name. Also get Macro Folder ID
                    const macroName = `Dynamic Intro: ${actorData.name}`;
                    let macroFolder = game.folders.find(f => f.name === MACRO_DIRECTORY && f.type === "Macro");

                    // Check of macro already exists. If so, Update. Otherwise, Create.
                    const existingMacro = game.macros.find(m => m.name === macroName);

                    if (existingMacro) {
                        // Update the macro command
                        await existingMacro.update({
                            command: macroCommand,
                            folder: macroFolder?.id || existingMacro.folder?.id
                        });
                        logDebug(`Macro "${macroName}" updated.`);
                        ui.notifications.info(`Macro "${macroName}" updated and stored in your Macro Directory!`);
                    } else {
                        // Create a new macro
                        const macroData = {
                            name: macroName,
                            type: "script",
                            scope: "global",
                            command: macroCommand,
                            img: actorData.img || "icons/svg/dice-target.svg",
                            folder: macroFolder?.id
                        };
                        Macro.create(macroData, { displaySheet: true });
                        logDebug("Macro Created.");
                        ui.notifications.info(`Macro "${macroName}" created and stored in your Macro Directory!`);
                    }
                }
            },
            test: {
                icon: '<i class="fas fa-eye"></i>',
                label: "Test Intro",
                callback: async html => {
                    // Collect the inputs
                    Object.assign(actorData, {
                        title: html.find('[name="title"]').val(),
                        subtitle1: html.find('[name="subtitle1"]').val(),
                        subtitle2: html.find('[name="subtitle2"]').val(),
                        font: html.find('[name="font"]').val(),
                        textColor: html.find('[name="textColor"]').val(),
                        textShadow: html.find('[name="textShadow"]').val(),
                    });

                    // Broadcast to just the GM client.
                    try {
                        await showDynamicIntro(actorData);
                    } catch (err) {
                        logWarning(err);
                    }

                    logInfo("Intro triggered for GM user");

                    // Re-render the dialog box
                    introBox.data.content = getDialogContent();
                    introBox.render(true);
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "save"
    });
    introBox.render(true);
}