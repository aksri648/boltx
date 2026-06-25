import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Initialize Capacitor native plugins at runtime.
 * StatusBar is configured declaratively in capacitor.config.ts.
 * Safe to call on web — no-ops when not running on a native platform.
 */
export async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Ensure keyboard scrolling is enabled so the focused input stays visible
  try {
    await Keyboard.setScroll({ isDisabled: false });
  } catch {
    // Keyboard plugin not available
  }

  // Hide the splash screen now that the app has mounted
  await SplashScreen.hide();
}
