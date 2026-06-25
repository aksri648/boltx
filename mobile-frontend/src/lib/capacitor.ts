import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try { await Keyboard.setScroll({ isDisabled: false }); } catch { /* ignore */ }
  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#00000000' });
  } catch { /* ignore */ }
  try { await SplashScreen.hide(); } catch { /* ignore */ }
}
