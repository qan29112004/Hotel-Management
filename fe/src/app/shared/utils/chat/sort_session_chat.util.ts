
export function SortBaseOnTimestampUtil(object:any) {
  return object.sort((a, b) => {
            const getTime = (item: any) => {
              if (item.lastMessageTimestamp && typeof item.lastMessageTimestamp.toDate === 'function') {
                return item.lastMessageTimestamp.toDate().getTime();
              }
              return -Infinity;
            };
            const getCreatedAtTime = (item: any) => item.createdAt || 0; // Mặc định 0 nếu không có createdAt

            const timeA = getTime(a);
            const timeB = getTime(b);
            if (timeA !== -Infinity && timeB !== -Infinity) {
              return timeB - timeA;
            }

            if (timeA !== -Infinity && timeB === -Infinity) {
              return -1;
            }
            
            if (timeA === -Infinity && timeB !== -Infinity) {
              return 1;
            }
            
            return getCreatedAtTime(b) - getCreatedAtTime(a);
          })
}