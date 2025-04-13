import board
import digitalio
import neopixel
import usb_hid
import time
from digitalio import DigitalInOut, Direction, Pull
from adafruit_hid.Keyboard import Keyboard
from adafruit_hid.Keycode import Keycode
from adafruit_hid.Keyboard_layout_US import KeyboardLayoutUS
from adafruit_debouncer import Debouncer
from adafruit_hid.mouse import Mouse

# Modifier le chiffre ci-dessous pour le délai du 4e mode, en secondes.
delay = 5

def init_button(pin):
    button_pin = DigitalInOut(pin)
    button_pin.direction = Direction.INPUT
    button_pin.pull = Pull.UP
    return Debouncer(button_pin)

mode_switch_button = init_button(board.GP15)
button_1 = init_button(board.GP16)
button_2 = init_button(board.GP17)
button_3 = init_button(board.GP18)
button_4 = init_button(board.GP19)
button_5 = init_button(board.GP20)

def press_space():
    kbd.press(Keycode.SPACE)
    kbd.release(Keycode.SPACE)

def press_enter():
    kbd.press(Keycode.ENTER)
    kbd.release(Keycode.ENTER)

def left_click():
    mouse.click(Mouse.LEFT_BUTTON)

def right_click():
    mouse.click(Mouse.RIGHT_BUTTON)

def double_click():
    mouse.click(Mouse.LEFT_BUTTON)
    mouse.click(Mouse.LEFT_BUTTON)

def press_left_arrow():
    kbd.press(Keycode.LEFT_ARROW)
    kbd.release(Keycode.LEFT_ARROW)

def press_right_arrow():
    kbd.press(Keycode.RIGHT_ARROW)
    kbd.release(Keycode.RIGHT_ARROW)

def press_up_arrow():
    kbd.press(Keycode.UP_ARROW)
    kbd.release(Keycode.UP_ARROW)

def press_down_arrow():
    kbd.press(Keycode.DOWN_ARROW)
    kbd.release(Keycode.DOWN_ARROW)

def cycle_mode():
    global current_mode_index
    current_mode_index = (current_mode_index + 1) % len(modes)
    pixels.fill(mode_colors[current_mode_index])
    pixels.show()

def mouse_left():
    mouse.move(x=-40)

def mouse_right():
    mouse.move(x=+40)

def mouse_up():
    mouse.move(y=-40)

def mouse_down():
    mouse.move(y=+40)

def mode_1():
    if button_1.fell:
        press_space()
    elif button_2.fell:
        press_enter()
    elif button_3.fell:
        left_click()
    elif button_4.fell:
        right_click()
    elif button_5.fell:
        double_click()

def mode_2():
    if button_1.fell:
        mouse_up()
    elif button_2.fell:
        mouse_down()
    elif button_3.fell:
        mouse_left()
    elif button_4.fell:
        mouse_right()
    elif button_5.fell:
        double_click()

def mode_3():
    if button_1.fell:
        press_up_arrow()
    elif button_2.fell:
        press_down_arrow()
    elif button_3.fell:
        press_left_arrow()
    elif button_4.fell:
        press_right_arrow()
    elif button_5.fell:
        press_space()

def mode_4():
    global last_button_press_time
    current_time = time.monotonic()
    if (current_time - last_button_press_time) >= delay:
        if button_1.fell:
            press_space()
            last_button_press_time = current_time
        elif button_2.fell:
            press_enter()
            last_button_press_time = current_time
        elif button_3.fell:
            left_click()
            last_button_press_time = current_time
        elif button_4.fell:
            right_click()
            last_button_press_time = current_time
        elif button_5.fell:
            double_click()
            last_button_press_time = current_time

def mode_5():
    if button_1.fell:
        kbd.press(Keycode.LEFT_GUI)
        kbd.press(Keycode.S)
        kbd.release(Keycode.LEFT_GUI)
        kbd.release(Keycode.S)
        time.sleep(0.5)
        layout.write("chrome")
        time.sleep(0.5)
        kbd.press(Keycode.ENTER)
        kbd.release(Keycode.ENTER)
        time.sleep(0.5)
        kbd.press(Keycode.LEFT_CONTROL)
        kbd.press(Keycode.L)
        kbd.release(Keycode.LEFT_CONTROL)
        kbd.release(Keycode.L)
        time.sleep(0.2)
        layout.write("www.youtube.com")
        kbd.press(Keycode.LEFT_SHIFT)
        kbd.press(Keycode.THREE)
        kbd.release(Keycode.LEFT_SHIFT)
        kbd.release(Keycode.THREE)
        layout.write("watch")
        kbd.press(Keycode.LEFT_SHIFT)
        kbd.press(Keycode.SIX)
        kbd.release(Keycode.LEFT_SHIFT)
        kbd.release(Keycode.SIX)
        layout.write("v=dQw4w9WgXcQ")
        kbd.press(Keycode.ENTER)
        kbd.release(Keycode.ENTER)
        time.sleep(4)
        kbd.press(Keycode.F)
        kbd.release(Keycode.F)
    elif button_2.fell:
        kbd.press(Keycode.LEFT_GUI)
        kbd.press(Keycode.S)
        kbd.release(Keycode.LEFT_GUI)
        kbd.release(Keycode.S)
        time.sleep(0.5)
        layout.write("chrome")
        time.sleep(0.5)
        kbd.press(Keycode.ENTER)
        kbd.release(Keycode.ENTER)
        time.sleep(0.5)
        kbd.press(Keycode.LEFT_CONTROL)
        kbd.press(Keycode.L)
        kbd.release(Keycode.LEFT_CONTROL)
        kbd.release(Keycode.L)
        time.sleep(0.2)
        layout.write("www.youtube.com")
        kbd.press(Keycode.LEFT_SHIFT)
        kbd.press(Keycode.THREE)
        kbd.release(Keycode.LEFT_SHIFT)
        kbd.release(Keycode.THREE)
        layout.write("watch")
        kbd.press(Keycode.LEFT_SHIFT)
        kbd.press(Keycode.SIX)
        kbd.release(Keycode.LEFT_SHIFT)
        kbd.release(Keycode.SIX)
        layout.write("v=WKi5s91a7OU&")
        kbd.press(Keycode.ENTER)
        kbd.release(Keycode.ENTER)
        time.sleep(4)
        kbd.press(Keycode.F)
        kbd.release(Keycode.F)
    elif button_3.fell:
        pass
    elif button_4.fell:
        pass
    elif button_5.fell:
        pass
def handle_buttons():
    modes[current_mode_index]()

pixel_pin = board.GP14
num_pixels = 1
pixels = neopixel.NeoPixel(pixel_pin, num_pixels, brightness=0.5, auto_write=True)

modes = [mode_1, mode_2, mode_3, mode_4, mode_5]
mode_colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (0, 255, 255), (255,255,0)]
current_mode_index = 0
pixels.fill(mode_colors[current_mode_index])

last_button_press_time = 0
debounce_interval = 0.2

kbd = Keyboard(usb_hid.devices)
layout = KeyboardLayoutUS(kbd)
mouse = Mouse(usb_hid.devices)

while True:

    mode_switch_button.update()
    button_1.update()
    button_2.update()
    button_3.update()
    button_4.update()
    button_5.update()

    if mode_switch_button.fell:
        cycle_mode()

    handle_buttons()
