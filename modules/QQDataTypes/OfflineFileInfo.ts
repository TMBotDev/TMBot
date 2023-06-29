/**
 * 离线文件信息
 */
export class OfflineFileInfo {
    constructor(private obj: {
        "name": string,
        "size": number,
        "url": string
    }) { }
    get name() { return this.obj.name; }
    get size() { return this.obj.size; }
    get url() { return this.obj.url; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}