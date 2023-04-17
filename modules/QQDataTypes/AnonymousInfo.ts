import { OneBotDocking } from "../OneBotDocking";

/**
 * 匿名信息
 */
export class AnonymousInfo {
    constructor(
        private group_id: number,
        private obj: {
            "id": number,
            "name": string,
            "flag": string
        }) { }
    /**
     * 设置禁言
     * (可能无权限失败)
     * @param time 秒,0取消
     */
    setMute(_this: OneBotDocking, time: number) {
        return _this.groupMuteAnonymous(this.group_id, this.obj.flag, time);
    }
    get id() { return this.obj.id; }
    get name() { return this.obj.name; }
    get flag() { return this.obj.flag; }

    get isValid() { return this.obj == null; }
}