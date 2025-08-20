import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Clutter from 'gi://Clutter';

export default class KbdBacklightIdle extends Extension {
    enable() {
        this._timeoutSec = 6;
        this._brightnessOn = 60;
        this._idleMonitor = global.backend.get_core_idle_monitor();
        this._sessionInhibitActive = false;

        this._idleWatchId = null;
        this._resetWatchId = null;
        this._eventSignalId = null;
        this._fallbackTimeoutId = null;

        // Periodically check inhibitors
        this._inhibitorCheckId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this._timeoutSec,
            () => {
                this._checkInhibitors();
                return GLib.SOURCE_CONTINUE;
            }
        );

        this._checkInhibitors();
        this._setupIdleWatch();
    }

    disable() {
        if (this._idleMonitor && this._idleWatchId) {
            this._idleMonitor.remove_watch(this._idleWatchId);
        }
        if (this._idleMonitor && this._resetWatchId) {
            this._idleMonitor.remove_watch(this._resetWatchId);
        }
        if (this._eventSignalId) {
            global.stage.disconnect(this._eventSignalId);
        }
        if (this._fallbackTimeoutId) {
            GLib.source_remove(this._fallbackTimeoutId);
        }
        if (this._inhibitorCheckId) {
            GLib.source_remove(this._inhibitorCheckId);
        }
        if (this._animSourceId) {
            GLib.source_remove(this._animSourceId);
        }

        this._idleMonitor = null;
        this._idleWatchId = null;
        this._resetWatchId = null;
        this._eventSignalId = null;
        this._fallbackTimeoutId = null;
        this._inhibitorCheckId = null;
        this._animSourceId = null;
    }

    _checkInhibitors() {
    try {
        let proxy = Gio.DBusProxy.new_for_bus_sync(
            Gio.BusType.SYSTEM,
            Gio.DBusProxyFlags.NONE,
            null,
            "org.freedesktop.login1",
            "/org/freedesktop/login1",
            "org.freedesktop.login1.Manager",
            null
        );

        let res = proxy.call_sync(
            "ListInhibitors",
            null,
            Gio.DBusCallFlags.NO_AUTO_START,
            -1,
            null
        );

        let [inhibitors] = res.deep_unpack();

        let sessionInhibitors = inhibitors.filter(([what, who, why, mode, uid, pid]) => {
            return (why && why.toLowerCase().includes("user session inhibited"));
        });

        let active = sessionInhibitors.length > 0;
        if (active !== this._sessionInhibitActive) {
            this._sessionInhibitActive = active;
            log(`kbd-backlight: session inhibitors ${active ? "active" : "cleared"}`);
            this._setupIdleWatch();
        }
    } catch (e) {
        log(`kbd-backlight: failed to query inhibitors: ${e.message}`);
        this._sessionInhibitActive = false;
    }
    }


    _setupIdleWatch() {
    if (!this._idleMonitor)
        return;

    // clear old watches
    if (this._idleWatchId) {
        this._idleMonitor.remove_watch(this._idleWatchId);
        this._idleWatchId = null;
    }
    if (this._resetWatchId) {
        this._idleMonitor.remove_watch(this._resetWatchId);
        this._resetWatchId = null;
    }

    if (this._sessionInhibitActive) {
        log("kbd-backlight: using fallback mode");
        this._fallbackTimeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this._timeoutSec,
            () => {
                this._animateToPercent(this._brightnessOn, 0, 1000);

                // ensure only one reset watch exists
                if (this._resetWatchId)
                    this._idleMonitor.remove_watch(this._resetWatchId);

                this._resetWatchId = this._idleMonitor.add_user_active_watch(() => {
                    this._animateToPercent(0, this._brightnessOn, 500);
                    // after restore, re-arm the idle logic for the next cycle
                    this._setupIdleWatch();
                });

                // one-shot fallback; we’ll re-arm on restore or inhibitor change
                this._fallbackTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            }
        );
    } else {
        // Normal path: real idle monitor
        log("kbd-backlight: using IdleMonitor mode");
        this._idleWatchId = this._idleMonitor.add_idle_watch(
            this._timeoutSec * 1000,
            () => {
                this._animateToPercent(this._brightnessOn, 0, 1000)

                this._resetWatchId = this._idleMonitor.add_user_active_watch(() => {
                    this._animateToPercent(0, this._brightnessOn, 500)
                });
            }
        );
    }
}

    _setBrightness(value) {
        try {
            GLib.spawn_command_line_async(
                `brightnessctl -q -d kbd_backlight s ${value}`
            );
        } catch (e) {
            log(`kbd-backlight: failed to set brightness: ${e.message}`);
        }
    }

    _animateToPercent(startPct, endPct, durationMs, rateHz = 30) {
        // Cancel a previous animation if running
        if (this._animSourceId) {
            GLib.source_remove(this._animSourceId);
            this._animSourceId = null;
        }

        const ticks = Math.round((durationMs / 1000) * rateHz)
        const steps_size = Math.round((endPct - startPct) / ticks)
        const time_size = Math.round(durationMs / ticks)
        this._number_animation_frames = 0

        const delta = (steps_size > 0) ? `+${steps_size}%` : `${Math.abs(steps_size)}%-`

        this._animSourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, time_size, () => {
            this._number_animation_frames++
            
            this._setBrightness(delta);

            if (this._number_animation_frames >= ticks) {
                this._setBrightness(`${endPct}%`);
                this._number_animation_frames = null
                this._animSourceId = null;
                return GLib.SOURCE_REMOVE;
            }
            return GLib.SOURCE_CONTINUE;
        });
    }
}


