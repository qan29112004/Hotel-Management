export function compareDates(dateStr1: string, dateStr2: string): number {
    const [d1, m1, y1] = dateStr1.split('/').map(Number);
    const [d2, m2, y2] = dateStr2.split('/').map(Number);

    const t1 = new Date(y1, m1 - 1, d1).getTime();
    const t2 = new Date(y2, m2 - 1, d2).getTime();

    return t1 - t2;
}