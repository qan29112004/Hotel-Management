export function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export function getCurrentDateString(date?): string {
    if(date){
        date = new Date(date)
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0'); // Tháng +1 vì getMonth() trả về 0-11
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  }

export function formatDateToLong(dateStr: string): string {
  const date = new Date(dateStr);
  
  // Cấu hình format
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',   // Friday
    day: 'numeric',    // 3
    month: 'short',    // Nov
    year: 'numeric',   // 2025
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function parseDate(dateStr: string): Date {
    // dateStr phải ở dạng 'yyyy-mm-dd'
    const [year, month, day] = dateStr.split('-').map(Number);

    // Lưu ý: tháng trong JavaScript là 0-based (0 = January, 11 = December)
    return new Date(year, month - 1, day);
}

export function formatDateRange(checkin: string, checkout: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);

  const checkinDay = checkinDate.getDate();
  const checkinMonth = months[checkinDate.getMonth()];
  const checkinYear = checkinDate.getFullYear();

  const checkoutDay = checkoutDate.getDate();
  const checkoutMonth = months[checkoutDate.getMonth()];
  const checkoutYear = checkoutDate.getFullYear();

  // ✅ chỉ rút gọn khi cùng tháng và cùng năm
  if (
    checkinDate.getMonth() === checkoutDate.getMonth() &&
    checkinDate.getFullYear() === checkoutDate.getFullYear()
  ) {
    return `${checkinDay} - ${checkoutDay} ${checkinMonth} ${checkinYear}`;
  }

  // ✅ nếu khác năm
  if (checkinYear !== checkoutYear) {
    return `${checkinDay} ${checkinMonth} ${checkinYear} - ${checkoutDay} ${checkoutMonth} ${checkoutYear}`;
  }

  // ✅ nếu khác tháng cùng năm
  return `${checkinDay} ${checkinMonth} - ${checkoutDay} ${checkoutMonth} ${checkoutYear}`;
}

export function calculateTotalAndAverage(r: any) {
  if (!r?.price || !Array.isArray(r.price)) return { total: 0, totalWithVat: 0, average: 0 };

  // Tính tổng
  const total = r.price.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0);

  // Tính VAT 10%
  const totalWithVat = total * 1.1;

  // Tính trung bình (sau khi cộng VAT)
  const average = totalWithVat / r.price.length;

  return {
    total,
    totalWithVat,
    average
  };
}

export function convertVNDToUSD(amountVND: number, rate = 25000): number {
  return amountVND / rate;
}

export function timeDate(timeString:string): Date {
  return new Date("1970-01-01T" + timeString);
}
