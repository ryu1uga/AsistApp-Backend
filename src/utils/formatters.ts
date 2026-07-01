export const formatTime = (d: Date | null | undefined): string | null =>
    d ? `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}` : null;

export const formatDate = (d: Date | null | undefined): string | null =>
    d ? d.toISOString().slice(0, 10) : null;

export const parseTime = (time: string | null | undefined): Date | null => {
    if (!time) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
};
