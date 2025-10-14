(function () {
  'use strict';

  const PREFERENCE_KEY = 'sensorielFullscreenPreferred';
  const doc = document;
  const docEl = doc.documentElement;

  function isFullscreenActive() {
    return Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement ||
      doc.mozFullScreenElement
    );
  }

  function shouldMaintainFullscreen() {
    try {
      return localStorage.getItem(PREFERENCE_KEY) === 'true';
    } catch (error) {
      console.warn('Sensoriel fullscreen preference unavailable:', error);
      return false;
    }
  }

  function setPreference(value) {
    try {
      if (value) {
        localStorage.setItem(PREFERENCE_KEY, 'true');
      } else {
        localStorage.removeItem(PREFERENCE_KEY);
      }
    } catch (error) {
      console.warn('Unable to persist fullscreen preference:', error);
    }
  }

  async function requestFullscreenInternal(element) {
    if (!element) {
      return false;
    }

    const request =
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.msRequestFullscreen ||
      element.mozRequestFullScreen;

    if (!request) {
      return false;
    }

    try {
      const result = request.call(element, { navigationUI: 'hide' });
      if (result && typeof result.then === 'function') {
        await result;
      }
      return true;
    } catch (error) {
      console.warn('Sensoriel fullscreen request failed:', error);
      return false;
    }
  }

  let gestureHandler = null;

  function removeGestureListeners() {
    if (!gestureHandler) {
      return;
    }

    const options = true; // capture = true to match registration
    doc.removeEventListener('pointerdown', gestureHandler, options);
    doc.removeEventListener('touchstart', gestureHandler, options);
    doc.removeEventListener('mousedown', gestureHandler, options);
    doc.removeEventListener('keydown', gestureHandler, options);
    gestureHandler = null;
  }

  function armGestureListeners() {
    if (gestureHandler || !shouldMaintainFullscreen() || isFullscreenActive()) {
      return;
    }

    gestureHandler = async () => {
      removeGestureListeners();
      const success = await requestFullscreenInternal(docEl);
      if (!success) {
        armGestureListeners();
      }
    };

    const options = { once: true, capture: true };
    doc.addEventListener('pointerdown', gestureHandler, options);
    doc.addEventListener('touchstart', gestureHandler, options);
    doc.addEventListener('mousedown', gestureHandler, options);
    doc.addEventListener('keydown', gestureHandler, options);
  }

  async function maintainFullscreen() {
    if (!shouldMaintainFullscreen()) {
      removeGestureListeners();
      return false;
    }

    if (isFullscreenActive()) {
      removeGestureListeners();
      return true;
    }

    const success = await requestFullscreenInternal(docEl);
    if (!success) {
      armGestureListeners();
    }
    return success;
  }

  function handleVisibilityReturn() {
    if (!doc.hidden) {
      maintainFullscreen();
    }
  }

  let iosZoomDisabled = false;

  function disableIOSZoom() {
    if (iosZoomDisabled) {
      return;
    }
    iosZoomDisabled = true;

    const listenerOptions = { passive: false, capture: true };

    const preventScaleGesture = (event) => {
      event.preventDefault();
    };

    const preventPinchMove = (event) => {
      const touches = event.touches || [];
      const scale = typeof event.scale === 'number' ? event.scale : 1;
      if (touches.length > 1 || scale !== 1) {
        event.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const preventDoubleTap = (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 350) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    doc.addEventListener('gesturestart', preventScaleGesture, listenerOptions);
    doc.addEventListener('gesturechange', preventScaleGesture, listenerOptions);
    doc.addEventListener('touchmove', preventPinchMove, listenerOptions);
    doc.addEventListener('touchend', preventDoubleTap, listenerOptions);
  }

  doc.addEventListener('fullscreenchange', () => {
    if (isFullscreenActive()) {
      removeGestureListeners();
    } else if (shouldMaintainFullscreen()) {
      armGestureListeners();
    }
  });

  doc.addEventListener('visibilitychange', handleVisibilityReturn);
  doc.addEventListener('DOMContentLoaded', () => {
    disableIOSZoom();
    if (shouldMaintainFullscreen()) {
      maintainFullscreen();
    }
  });
  window.addEventListener('pageshow', () => {
    if (shouldMaintainFullscreen()) {
      maintainFullscreen();
    }
  });

  window.SensorielFullscreen = {
    flagKey: PREFERENCE_KEY,
    isActive: isFullscreenActive,
    shouldMaintain: shouldMaintainFullscreen,
    markPreferred(value) {
      setPreference(Boolean(value));
      if (value) {
        maintainFullscreen();
      } else {
        removeGestureListeners();
      }
    },
    ensure: maintainFullscreen,
    requestNow: () => requestFullscreenInternal(docEl),
    armGesture: armGestureListeners
  };
})();
