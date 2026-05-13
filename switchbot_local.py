import asyncio
from bleak import BleakClient

DEVICE_ADDRESS = "E8:55:03:86:08:6D"
WRITE_CHAR_UUID = "cba20002-224d-11e6-9fb8-0002a5d5c51b"

ACTION = "press"   # change to "on" or "off" if needed

COMMANDS = {
    "press": bytes([0x57, 0x01, 0x00]),
    "on":    bytes([0x57, 0x01, 0x01]),
    "off":   bytes([0x57, 0x01, 0x02]),
}

async def main():
    if ACTION not in COMMANDS:
        print("Invalid ACTION. Use: press, on, or off")
        return

    print(f"Connecting to {DEVICE_ADDRESS}...")

    try:
        async with BleakClient(DEVICE_ADDRESS, timeout=15.0) as client:
            if not client.is_connected:
                print("Failed to connect.")
                return

            print("Connected.")
            await client.write_gatt_char(
                WRITE_CHAR_UUID,
                COMMANDS[ACTION],
                response=True
            )
            print(f"Command sent: {ACTION}")

    except Exception as e:
        print("Error:", e)

asyncio.run(main())