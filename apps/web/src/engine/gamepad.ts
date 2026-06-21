/**
 * Gamepad Input - Controller support with haptic feedback.
 *
 * Maps gamepad buttons to keyboard equivalents for seamless integration.
 * Supports: Xbox, PlayStation, Switch Pro controllers.
 *
 * Button mapping:
 *   A/Cross     -> type letter (cycles through alphabet)
 *   B/Circle    -> Escape (back/pause)
 *   X/Square    -> Enter/confirm
 *   Y/Triangle  -> R (restart)
 *   D-Pad       -> navigate menus
 *   Start       -> Start game
 *   Select/Back -> Open settings
 */

let gamepadState = null;
let connected = false;
let lastButtonStates = {};
let buttonCallbacks = [];

/**
 * Initialize gamepad polling. Call once on engine start.
 */
export function initGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
        connected = true;
        console.log('Gamepad connected:', e.gamepad.id);
    });
    window.addEventListener('gamepaddisconnected', () => {
        connected = false;
        gamepadState = null;
        lastButtonStates = {};
    });
}

/**
 * Poll gamepad state. Call once per frame in the game loop.
 * Returns button press events (rising edge only).
 */
export function pollGamepad() {
    if (!connected) return [];

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return [];

    const events = [];

    // D-Pad mapping (axes or buttons)
    const dpadUp = gp.buttons[12]?.pressed || (gp.axes[1] < -0.5);
    const dpadDown = gp.buttons[13]?.pressed || (gp.axes[1] > 0.5);
    const dpadLeft = gp.buttons[14]?.pressed || (gp.axes[0] < -0.5);
    const dpadRight = gp.buttons[15]?.pressed || (gp.axes[0] > 0.5);

    // Face buttons
    const btnA = gp.buttons[0]?.pressed;      // A / Cross
    const btnB = gp.buttons[1]?.pressed;      // B / Circle
    const btnX = gp.buttons[2]?.pressed;      // X / Square
    const btnY = gp.buttons[3]?.pressed;      // Y / Triangle
    const btnStart = gp.buttons[9]?.pressed;  // Start / Options
    const btnSelect = gp.buttons[8]?.pressed; // Select / Share

    // Rising edge detection
    const check = (name, pressed) => {
        if (pressed && !lastButtonStates[name]) {
            events.push(name);
        }
        lastButtonStates[name] = pressed;
    };

    check('dpad_up', dpadUp);
    check('dpad_down', dpadDown);
    check('dpad_left', dpadLeft);
    check('dpad_right', dpadRight);
    check('a', btnA);
    check('b', btnB);
    check('x', btnX);
    check('y', btnY);
    check('start', btnStart);
    check('select', btnSelect);

    return events;
}

/**
 * Convert gamepad event to keyboard-like key string.
 * Returns null if no mapping exists.
 */
export function gamepadToKey(event) {
    switch (event) {
        case 'dpad_up': return 'ArrowUp';
        case 'dpad_down': return 'ArrowDown';
        case 'dpad_left': return 'ArrowLeft';
        case 'dpad_right': return 'ArrowRight';
        case 'a': return 'Enter';
        case 'b': return 'Escape';
        case 'x': return ' ';
        case 'y': return 'r';
        case 'start': return 'Enter';
        case 'select': return 'h';
        default: return null;
    }
}

/**
 * Trigger gamepad haptic feedback (if supported).
 */
export function gamepadVibrate(intensity, duration) {
    if (!connected) return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp || !gp.vibrationActuator) return;

    try {
        gp.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: duration || 100,
            weakMagnitude: intensity || 0.5,
            strongMagnitude: intensity || 0.5,
        });
    } catch {}
}

/**
 * Get gamepad connection status.
 */
export function isGamepadConnected() {
    return connected;
}
