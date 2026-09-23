/**
 * Math and helper utilities for 3D Racing Simulator
 */

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

export function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 100);

    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');
    const msStr = String(millis).padStart(2, '0');

    return `${mStr}:${sStr}.${msStr}`;
}

export function shortenAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}
