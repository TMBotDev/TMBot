import { OneBotDocking } from "../OneBotDocking";

/**
 * 陌生人信息
 */
export class StrangerInfo {
    constructor(private obj: {
        "user_id": number,
        "nickname": string,
        "sex": "male" | "female" | "unknown",
        "age": number,
        "qid": string | undefined,
        "level": number | undefined,
        "login_days": number | undefined
    }) { }
    /**
     * 方便函数
     * 可能发送失败
     */
    sendMsg(_this: OneBotDocking, msg: string) {
        return _this.sendMsg("private", this.obj.user_id, msg);
    }
    toFriend(_this: OneBotDocking) {
        return _this.getFriendInfoSync(this.obj.user_id);
    }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    set nickname(a) { this.obj.nickname = a; }
    /**
     * 不准,默认unknown
     */
    get sex() { return this.obj.sex; }
    /**
     * 不准,默认0
     */
    get age() { return this.obj.age; }
    get qid() { return this.obj.qid; }
    get level() { return this.obj.level; }
    get login_days() { return this.obj.login_days; }
}