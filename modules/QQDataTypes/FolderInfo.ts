/**
 * 文件夹信息
 */
export class FolderInfo {
    constructor(private obj: {
        "group_id": number,
        "folder_id": number,
        "folder_name": string,
        "create_time": number,
        "creator": number,
        "creator_name": string,
        "total_file_count": number
    }) { }
    get group_id() { return this.obj.group_id; }
    get folder_id() { return this.obj.folder_id; }
    get folder_name() { return this.obj.folder_name; }
    get create_time() { return this.obj.create_time; }
    get creator() { return this.obj.creator; }
    get creator_name() { return this.obj.creator_name; }
    get total_file_count() { return this.obj.total_file_count; }
}