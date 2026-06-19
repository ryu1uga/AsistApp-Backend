export const formatTime = (d: Date | null | undefined): string | null =>
    d ? `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}` : null;

export const formatDate = (d: Date | null | undefined): string | null =>
    d ? d.toISOString().slice(0, 10) : null;
