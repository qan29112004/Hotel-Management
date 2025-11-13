import { interval, pipe, filter, take } from "rxjs";

export function waitImageUploadUtil(condition:any, checkInterval = 100){
    return interval(checkInterval).pipe(
        filter(() => condition()),
        take(1)
    )
}