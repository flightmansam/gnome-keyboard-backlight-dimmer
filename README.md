A GNOME Shell extension that automatically dims and restores your laptop keyboard backlight when the system is idle. I actually can't believe this isn't already out there but to the best I can find, it isn't! It is modelled after the backlight brightness transistions of built in apple keyboards (sorry macbook haters!), that is, 1s fade out and 0.5s fade in. It uses IdleMonitor for responsiveness, and falls back to user input detection when the session is inhibited (such as during video playback or caffeine).


## Requirements

This extension relies on [brightnessctl](https://github.com/Hummer12007/brightnessctl) to adjust the backlight. Note that you need to do the setup that allows access of leds through udev rules so that it doesn't need sudo:


1. **Add correct udev permissions**  
   ```bash
   sudo nano /etc/udev/rules.d/90-brightnessctl.rules
   ```
   Add:
   ```
   ACTION=="add", SUBSYSTEM=="backlight", RUN+="/bin/chgrp video /sys/class/backlight/%k/brightness"
   ACTION=="add", SUBSYSTEM=="backlight", RUN+="/bin/chmod g+w /sys/class/backlight/%k/brightness"
   ACTION=="add", SUBSYSTEM=="leds", RUN+="/bin/chgrp input /sys/class/leds/%k/brightness"
   ACTION=="add", SUBSYSTEM=="leds", RUN+="/bin/chmod g+w /sys/class/leds/%k/brightness"
   ```

2. Then reload rules:
   ```bash
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

3. **Add your user to required groups**:
   ```bash
   sudo usermod -aG video,input $USER
   ```

   Log out and back in for group changes to take effect.

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

- Preferences menu for idle timeout, brightness values, and fade times.  
- Integration with GNOME Quick Settings keyboard brightness toggle.  
- Support for laptops with different `kbd_backlight` device (e.g. Dell and others?).
- Non-linear transtion curves (surely Craig Federighi would have used something sexy like that in macOS)
- Add to GNOME Extensions repo

## Disclaimer
I have only tested this with the following devices:
- 16" M1 Pro running Asahi Fedora Remix 42 (Gnome 48)
- 11" 2015 MacBook Air running Fedora 42 (Gnome 48)
