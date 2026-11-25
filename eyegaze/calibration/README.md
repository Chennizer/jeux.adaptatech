# Tobii calibration launcher for Talon

This tool starts **Talon's real eye-tracker calibration** from a large,
accessible web control. It is not a calibration test and it does not estimate
accuracy in the browser. Talon remains the owner of the Tobii device and draws
the calibration targets.

## Install once (Windows)

1. Confirm that the Tobii tracker already works in Talon.
2. Download [`talon/adaptatech_calibration.py`](talon/adaptatech_calibration.py).
3. From the Talon tray icon, choose **Scripting → Open `user` folder**.
4. Copy the file into that folder. Talon reloads it automatically.
5. Open the calibration page and wait for **Talon connected**.

The helper listens only on `127.0.0.1:8765`; it does not expose the computer to
the network. The page sends a request to that local helper, which schedules
Talon's `tracking.calibrate` action on Talon's main thread.

## Why not call a Tobii SDK from the page?

A browser cannot access the native Tobii API directly. More importantly, opening
the tracker a second time from a Tobii SDK can compete with the Talon process
that already owns it. Using Talon's tracking action preserves the same device,
display mapping, driver, and runtime that are used for gaze control.

Tobii Pro SDK calibration is intended for supported Tobii Pro hardware and its
licensing/support matrix should not be assumed to cover Eye Tracker 4C or 5.
Tobii Gaming's Stream Engine is a native game-integration API, not a browser
calibration API. For this Talon-based setup, the Talon action is therefore the
smallest and least conflicting integration point.

## Troubleshooting

- **Not connected:** verify the file is in Talon's active `user` folder, then
  inspect **Scripting → View log** for “Adaptatech calibration bridge”.
- **Port already in use:** close the other process using port 8765, or change
  `PORT` in both the Python helper and `BRIDGE_URL` in `index.html`.
- **Calibration does not appear:** use Talon's own calibration command once to
  confirm the tracker supports calibration and that Talon can see it.
- Keep the Tobii runtime/driver required by the device installed. Do not run a
  second eye-tracking application at the same time as Talon.

## Technical references

- [Talon Python API documentation](https://talonvoice.com/docs/)
- [Tobii Pro SDK screen-based calibration](https://developer.tobiipro.com/commonconcepts/calibration.html)
- [Tobii Gaming developer portal](https://developer.tobii.com/)
