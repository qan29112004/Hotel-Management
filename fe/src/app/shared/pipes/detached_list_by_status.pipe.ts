import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'groupByStatus', standalone:true })
export class GroupByStatusPipe implements PipeTransform {
  transform(list: any[]) {
    return list.reduce((acc, item) => {
      acc[item.status] = acc[item.status] || [];
      acc[item.status].push(item);
      return acc;
    }, {});
  }
}
