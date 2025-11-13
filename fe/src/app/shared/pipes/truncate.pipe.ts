import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name:'truncate', standalone:true})
export class TruncatePipe implements PipeTransform{
    transform(value: any, limit:number = 23):string {
        if(!value)return;
        return value && value.length > limit ? value.slice(0,limit) + "..." : value;
    }
}