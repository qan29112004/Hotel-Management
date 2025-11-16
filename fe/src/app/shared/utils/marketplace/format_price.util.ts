export function formatPrice(value: number | string): string {
    const num = Number(value);

    if (isNaN(num)) {
        return String(value); // Nếu không phải số thì trả về nguyên
    }

    // Nếu là số nguyên
    if (Number.isInteger(num)) {
        return num.toLocaleString("vi-VN");
    } else {
        // Có phần thập phân
        const [integerPart, decimalPart] = num.toString().split(".");
        return `${Number(integerPart).toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}