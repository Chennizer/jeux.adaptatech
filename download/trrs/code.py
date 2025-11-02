import time
import board
import digitalio
import keypad
import usb_hid
import neopixel
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode

ENABLE_SECOND_SWITCH = False               # False = 1 switch (TIP), True = 2 switches (TIP + RING_1) for a splitter.


PRIMARY_KEY_TO_SEND   = Keycode.SPACE
SECONDARY_KEY_TO_SEND = Keycode.ENTER


NEOPIXEL_BRIGHTNESS_IDLE   = 0.4
NEOPIXEL_BRIGHTNESS_ACTIVE = 0.9

COLOR_IDLE        = (0, 0, 64)
COLOR_PRESS_TIP   = (0, 128, 0)
COLOR_PRESS_RING1 = (200, 90, 0)

STARTUP_BLINKS   = 2
STARTUP_BLINK_MS = 120


if hasattr(board, "NEOPIXEL_POWER"):
    np_pwr = digitalio.DigitalInOut(board.NEOPIXEL_POWER)
    np_pwr.direction = digitalio.Direction.OUTPUT
    np_pwr.value = True

sleeve_ground = digitalio.DigitalInOut(board.SLEEVE)
sleeve_ground.direction = digitalio.Direction.OUTPUT
sleeve_ground.value = False

switch_pins = (board.TIP, board.RING_1) if ENABLE_SECOND_SWITCH else (board.TIP,)
switches = keypad.Keys(switch_pins, value_when_pressed=False, pull=True)

keyboard = Keyboard(usb_hid.devices)
key_mapping = [PRIMARY_KEY_TO_SEND, SECONDARY_KEY_TO_SEND] if ENABLE_SECOND_SWITCH else [PRIMARY_KEY_TO_SEND]
is_pressed = [False] * len(key_mapping)


pixel = neopixel.NeoPixel(board.NEOPIXEL, 1, brightness=NEOPIXEL_BRIGHTNESS_IDLE, auto_write=True)


def set_pixel(color, active=False):
    """Set color with appropriate brightness (idle vs active)."""
    pixel.brightness = NEOPIXEL_BRIGHTNESS_ACTIVE if active else NEOPIXEL_BRIGHTNESS_IDLE
    pixel[0] = color

def mix_colors(c1, c2):
    """Add two (R,G,B) tuples with clamping."""
    return tuple(min(255, c1[i] + c2[i]) for i in range(3))

def show_idle():
    set_pixel(COLOR_IDLE, active=False)

def startup_blink():
    for _ in range(STARTUP_BLINKS):
        set_pixel(COLOR_IDLE, active=True)
        time.sleep(STARTUP_BLINK_MS / 1000.0)
        set_pixel((0, 0, 0), active=False)
        time.sleep(STARTUP_BLINK_MS / 1000.0)
    show_idle()

def refresh_pixel_from_state():
    """
    One-switch mode:
      - No press: BLUE (idle)
      - TIP pressed: GREEN
    Two-switch mode:
      - No press: BLUE
      - Only TIP pressed: GREEN
      - Only RING_1 pressed: ORANGE
      - Both pressed: mix(GREEN, ORANGE)
    """
    if not any(is_pressed):
        show_idle()
        return

    if ENABLE_SECOND_SWITCH:
        active_color = (0, 0, 0)
        if is_pressed[0]:
            active_color = mix_colors(active_color, COLOR_PRESS_TIP)
        if len(is_pressed) > 1 and is_pressed[1]:
            active_color = mix_colors(active_color, COLOR_PRESS_RING1)
        set_pixel(active_color, active=True)
    else:

        set_pixel(COLOR_PRESS_TIP, active=True)


startup_blink()
show_idle()

while True:
    event = switches.events.get()
    if event is None:
        continue

    key_to_type = key_mapping[event.key_number]
    if event.pressed:
        is_pressed[event.key_number] = True
        keyboard.press(key_to_type)
        refresh_pixel_from_state()
    else:
        is_pressed[event.key_number] = False
        keyboard.release(key_to_type)
        refresh_pixel_from_state()
