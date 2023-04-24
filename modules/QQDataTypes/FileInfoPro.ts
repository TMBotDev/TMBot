/**
 * 群文件信息
 */
export class FileInfoPro {
    constructor(private obj: {
        "group_id": number,
        "file_id": string,
        "file_name": string,
        "busid": number,
        "file_size": number,
        "upload_time": number,
        "dead_time": number,
        "modify_time": number,
        "download_times": number,
        "uploader": number,
        "uploader_name": string
    }) { }
    get group_id() { return this.obj.group_id; }
    get file_id() { return this.obj.file_id; }
    get file_name() { return this.obj.file_name; }
    get busid() { return this.obj.busid; }
    get file_size() { return this.obj.file_size; }
    //上传时间
    get upload_time() { return this.obj.upload_time; }
    //过期时间,永久文件恒为0
    get dead_time() { return this.obj.dead_time; }
    //最后修改时间
    get modify_time() { return this.obj.modify_time; }
    //下载次数
    get download_times() { return this.obj.download_times; }
    //上传者ID
    get uploader() { return this.obj.uploader; }
    get uploader_name() { return this.obj.uploader_name; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}