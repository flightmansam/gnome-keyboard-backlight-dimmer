# Keyboard Backlight Idle
A GNOME Shell extension that automatically dims and restores your laptop keyboard backlight when the system is idle. I actually can't believe this isn't already out there but to the best I can find, it isn't! It is modelled after the backlight brightness transistions of built in apple keyboards (sorry macbook haters!), that is, 1s fade out and 0.5s fade in. It uses IdleMonitor for responsiveness, and falls back to user input detection when the session is inhibited (such as during video playback or caffeine).

## Installation
Clone into your extensions directory:
```bash
git clone https://github.com/flightmansam/gnome-keyboard-backlight-dimmer.git \
~/.local/share/gnome-shell/extensions/kbd-backlight@flightmansam
```
  
Then enable via GNOME Extensions app or:
```bash
gnome-extensions enable kbd-backlight@flightmansam
```

## Future Work
- [ ] Preferences menu for idle timeout, ~~brightness values~~, and fade times.
- [x] Integration with GNOME Quick Settings keyboard brightness toggle.
- [x] Support for laptops with different `kbd_backlight` device (e.g. Dell and others?).
- [ ] Non-linear transtion curves (surely Craig Federighi would have used something sexy like that in macOS)
- [ ] Add to GNOME Extensions repo

## Disclaimer
I have only tested this with the following devices:
- 16" M1 Pro running Asahi Fedora Remix 42 (Gnome 48)
- 11" 2015 MacBook Air running Fedora 42 (Gnome 48)

This extension will probably(?) not work if your backlight doesn't support brightness range of 0-100% (e.g. some have levels 0-4).
