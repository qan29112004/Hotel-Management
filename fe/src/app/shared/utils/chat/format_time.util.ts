import { TranslocoService } from '@ngneat/transloco';

function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

export function formatTimestamp(timestamp: number): string[] {
  if (!timestamp || typeof timestamp !== 'number') return [];

  const date: Date = new Date(timestamp * 1000); // nhân 1000 để từ giây -> milliseconds
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  const getDay = `${day}/${month}/${year}`;
  const getTime = `${hours}:${minutes}`;

  return [getDay, getTime];
}



export function subTime(timestamp: any, transloco: TranslocoService): string {
    if (!timestamp) return '';
    
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      const key = diffInMinutes === 1 ? "chat.minute": "chat.minutes";
      return diffInMinutes === 0 ? transloco.translate('chat.just_now') : `${diffInMinutes} ${transloco.translate(key)} ${transloco.translate('chat.ago')}`;
    } else if (diffInHours < 24) {
        const key = Math.floor(diffInHours) === 1 ? "chat.hour": "chat.hours";
      return `${Math.floor(diffInHours)} ${transloco.translate(key)} ${transloco.translate('chat.ago')}`;
    } else if (diffInHours < 168) { 
        const key = Math.floor(diffInHours / 24) === 1 ? "chat.day": "chat.days";
      return `${Math.floor(diffInHours / 24)} ${transloco.translate(key)} ${transloco.translate('chat.ago')}`;
    } else {
      return date.toLocaleDateString();
    }
  }
  