/**
 * 文件信息
 */
export class FileInfo {
    constructor(private obj: {
        "id": string,
        "name": string,
        "size": number,
        "busid": number
    }) { }
    get id() { return this.obj.id; }
    get name() { return this.obj.name; }
    get size() { return this.obj.size; }
    get busid() { return this.obj.busid; }
}