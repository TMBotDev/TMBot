import { OneBotDocking } from "../OneBotDocking";

/**
 * 好友信息
 */
export class FriendInfo {
    constructor(private obj: {
        "user_id": number,
        "nickname": string,
        "remark": string
    }) { }
    /**
     * 向好友发送消息(方便函数)
     */
    sendMsg(_this: OneBotDocking, msg: string) {
        return _this.sendMsg("private", this.obj.user_id, msg);
    }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    set nickname(a) { this.obj.nickname = a; }
    get remark() { return this.obj.remark; }
    set remark(a) { this.obj.remark = a; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}