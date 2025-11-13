import { FuseNavigationItem } from "@fuse/components/navigation";

export function pushItemNavigation(navigation: { compact: FuseNavigationItem[], default: FuseNavigationItem[], futuristic: FuseNavigationItem[], horizontal: FuseNavigationItem[] }, includeIds:any[], code?: string, type?:string){
    navigation.compact.forEach(item => {
        if (item.code === code || (!item.code && type && item.type=== type) || (item.code === code && type && item.type === type)) {
            includeIds.push(item.id);
        }
    });
    navigation.default.forEach(item => {
        if (item.code === code || (!item.code && type && item.type=== type) || (item.code === code && type && item.type === type)) {
            includeIds.push(item.id);
        }
    });
    navigation.futuristic.forEach(item => {
        if (item.code === code || (!item.code && type && item.type=== type) || (item.code === code && type && item.type === type)) {
            includeIds.push(item.id);
        }
    });
    navigation.horizontal.forEach(item => {
        if (item.code === code || (!item.code && type && item.type=== type) || (item.code === code && type && item.type === type)) {
            includeIds.push(item.id);
        }
    });
    return includeIds
}