/**
 * 设备信息
 */
export class DeviceInfo {
    constructor(private obj: {
        "app_id": number,
        "device_name": string,
        "device_kind": string
    }) { }
    get app_id() { return this.obj.app_id; }
    get device_name() { return this.obj.device_name; }
    /** 设备类型 */
    get device_kind() { return this.obj.device_kind; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}