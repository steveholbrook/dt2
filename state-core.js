(function(globalFactory){
  const factory = function() {
    function coerceDate(value, fallback) {
      if (value instanceof Date && !isNaN(value.getTime())) {
        return value;
      }
      if (typeof value === 'number') {
        const byNumber = new Date(value);
        if (!isNaN(byNumber.getTime())) return byNumber;
      }
      if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      if (fallback instanceof Date && !isNaN(fallback.getTime())) {
        return fallback;
      }
      return null;
    }

    function ensureFocusState(state, active, options = {}) {
      if (!state || typeof state !== 'object') {
        throw new TypeError('state is required for ensureFocusState');
      }
      const desired = !!active;
      const previous = !!state.fullscreenMode;
      let since = null;

      if (desired) {
        const now = options.now instanceof Date ? options.now : new Date();
        since = coerceDate(options.since, coerceDate(state.fullscreenSince, now)) || now;
      }

      state.fullscreenMode = desired;
      state.fullscreenSince = desired ? since : null;

      return {
        changed: previous !== desired,
        since: since || null
      };
    }

    function ensureDarkMode(state, enabled) {
      if (!state || typeof state !== 'object') {
        throw new TypeError('state is required for ensureDarkMode');
      }
      const desired = !!enabled;
      const previous = !!state.darkMode;
      state.darkMode = desired;
      return {
        changed: previous !== desired
      };
    }

    function ensureMessagingState(state, enabled) {
      if (!state || typeof state !== 'object') {
        throw new TypeError('state is required for ensureMessagingState');
      }
      const desired = !!enabled;
      const previous = !!state.messagesOn;
      state.messagesOn = desired;
      return {
        changed: previous !== desired
      };
    }

    function startDowntime(state, options = {}) {
      if (!state || typeof state !== 'object') {
        throw new TypeError('state is required for startDowntime');
      }
      const now = coerceDate(options.now, new Date()) || new Date();
      const durationHours = typeof options.durationHours === 'number' && options.durationHours > 0
        ? options.durationHours
        : 24;

      state.downtimeStarted = true;
      state.downtimeStartTime = now;
      state.downtimeDuration = durationHours;
      state.downtimePaused = false;
      state.pausedDuration = 0;
      state.pauseStartTime = null;

      return {
        startTime: now,
        durationHours
      };
    }

    return {
      ensureFocusState,
      ensureDarkMode,
      ensureMessagingState,
      startDowntime
    };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    globalFactory.StateCore = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis);
