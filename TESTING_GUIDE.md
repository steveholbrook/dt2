# Testing Guide - Critical Fixes

## Quick Test (5 Minutes)

### Test 1: Host Blocking
**Goal:** Verify only one host can control active downtime

**Steps:**
1. ☐ Open Chrome: `?customer=QuickTest&viewer=0`
2. ☐ Start downtime
3. ☐ Open Firefox: `?customer=QuickTest&viewer=0`
4. ☐ **Verify:** Alert appears in Firefox
5. ☐ **Verify:** Firefox URL changes to `viewer=1`
6. ☐ **Verify:** Firefox is in VIEWER mode

**Expected Alert:**
```
⚠️ HOST MODE BLOCKED

Another user is currently controlling an active downtime session...
```

**Pass Criteria:**
- ✅ Alert shown in second browser
- ✅ URL updated automatically
- ✅ Console logs: "⚠️ Cannot become host"

---

### Test 2: Viewer Display
**Goal:** Verify viewers see everything

**Steps:**
1. ☐ Browser 1 (Host): Active downtime running
2. ☐ Browser 2 (Viewer): Open viewer URL
3. ☐ **Check these elements are visible:**
   - ☐ Status: "In Progress" (red color)
   - ☐ Duration: Updating every second (e.g., 00:05:23)
   - ☐ Progress panel: Visible with percentages
   - ☐ Timeline: Red line moving
   - ☐ Start time: Shows actual time
   - ☐ Runbook tasks: All visible

**Pass Criteria:**
- ✅ All 6 elements visible
- ✅ Duration counts up every second
- ✅ Timeline marker moves
- ✅ Console logs: "📊 Viewer: Updating UI"

---

### Test 3: Real-Time Sync
**Goal:** Verify host changes appear in viewer

**Steps:**
1. ☐ Host and Viewer both open
2. ☐ Host: Add a task
   - ☐ Viewer: Task appears (within 1 second)
3. ☐ Host: Mark task complete
   - ☐ Viewer: Checkmark appears
4. ☐ Host: Pause downtime
   - ☐ Viewer: Status changes to "Paused" (orange)
5. ☐ Host: Resume downtime
   - ☐ Viewer: Status back to "In Progress" (red)

**Pass Criteria:**
- ✅ All changes sync within 1 second
- ✅ No refresh needed
- ✅ Viewer sees everything host does

---

## Console Checks

### Open DevTools (F12) → Console

**Host Should Show:**
```javascript
✓ Became controller: user-abc123
✓ Downtime started by host: user-abc123
✓ Mode: HOST
```

**Viewer Should Show:**
```javascript
✓ Mode: VIEWER
✓ Session snapshot received: {downtimeStarted: true}
✓ 📊 Viewer: Updating UI for active downtime
```

**Blocked Host Should Show:**
```javascript
⚠️ Cannot become host: Downtime is active with another controller
```

---

## Troubleshooting

### Problem: Viewer Shows Blank Screen

**Check in order:**

1. **Open Console (F12)**
   - Look for: `Session snapshot received`
   - If missing → Firebase connection issue

2. **Check for JavaScript errors**
   - Red error messages in console
   - Fix any blocking errors first

3. **Verify session state**
   - Should see: `downtimeStarted: true`
   - If false → Host hasn't started yet

4. **Check visibility logs**
   - Should see: `📊 Viewer: Updating UI`
   - If missing → updateViewerPanel() issue

5. **Force refresh (Ctrl+F5)**
   - Clears cache
   - Reloads all scripts

### Problem: Multiple Hosts Not Blocked

**Check in order:**

1. **Verify downtime is actually started**
   - Host should have clicked "Start Downtime"
   - Status should show "In Progress"

2. **Check console for blocking**
   - Should see: `⚠️ Cannot become host`
   - If missing → Blocking logic not triggered

3. **Verify customer names match**
   - Host: `?customer=Acme`
   - 2nd User: `?customer=Acme`
   - Must be EXACT match

4. **Check Firebase connection**
   - Both users need active connection
   - Look for: `Session snapshot received`

---

## Success Checklist

### Host Mode
- ☐ Can start downtime
- ☐ Can control all buttons
- ☐ Can edit runbooks
- ☐ See "mode: HOST" in console
- ☐ Duration updates every second
- ☐ Timeline moves

### Viewer Mode  
- ☐ See "mode: VIEWER" in console
- ☐ All controls disabled (grayed out)
- ☐ Duration updates every second
- ☐ Timeline moves
- ☐ Progress panel visible
- ☐ Can see all host changes
- ☐ Cannot start/stop downtime

### Host Blocking
- ☐ Alert shown when blocked
- ☐ URL updates to viewer=1
- ☐ Console shows warning
- ☐ Forced to viewer mode
- ☐ Can view but not control

---

## Test Scenarios Matrix

| Test | Host | Second User | Expected |
|------|------|-------------|----------|
| 1 | Start downtime | Open as host | Alert + Viewer mode |
| 2 | Running session | Open as viewer | See everything |
| 3 | Stop downtime | Open as host | Becomes host |
| 4 | Add task | Viewing | Sees new task |
| 5 | Not started | Open as host | Becomes host |

---

## Quick Visual Checks

### Viewer Should See:
```
Header:
  Status: In Progress [RED]
  Duration: 00:15:42 [COUNTING UP]

Progress Panel: [VISIBLE]
  Total: 10 tasks
  Completed: 4 tasks
  Remaining: 6 tasks
  Completion: 40%

Timeline:
  [Red moving line →] 

Runbook Table:
  [All tasks visible]
  [Checkmarks on completed]
  [Buttons disabled/grayed]

Bottom Right Panel: [VISIBLE]
  mode: VIEWER
  Customer: Acme Corp
  Status: Running
  Progress: ██████░░░░ 40%
```

### Host Should See:
```
Same as viewer, but:
  - All buttons enabled
  - Can edit fields
  - Can control session
  - mode: HOST
```

---

## If All Tests Pass

✅ **Multiple host prevention working**
✅ **Viewer display working**
✅ **Real-time sync working**
✅ **Ready for production!**

Deploy and monitor console logs for first few real sessions.

---

## If Tests Fail

1. Check browser console for errors
2. Review CRITICAL_FIXES.md for details
3. Verify all steps followed exactly
4. Test with different customer names
5. Try incognito mode to rule out caching

---

## Emergency Rollback

If critical issues found:
1. Use previous version of index.html
2. Report specific error messages
3. Include console logs
4. Include steps to reproduce

---

**Time to Test:** ~5 minutes
**Time to Fix Issues:** Varies by problem
**Confidence Level:** 🟢 High (extensive logging)
