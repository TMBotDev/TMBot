/**
 * 群文件系统信息
 */
export class GroupFileSystemInfo {
    constructor(private obj: {
        "file_count": number,
        "limit_count": number,
        "used_space": number,
        "total_space": number
    }) { }
    //文件总数
    get file_count() { return this.obj.file_count; }
    //文件上限
    get limit_count() { return this.obj.limit_count; }
    //已使用空间
    get used_space() { return this.obj.used_space; }
    //空间上限
    get total_space() { return this.obj.total_space; }
}