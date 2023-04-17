import { OneBotDocking } from "../OneBotDocking";

/**
 * 单向好友信息
 */
export class UnidirectionalFriendInfo {
    constructor(private obj: {
        "user_id": number,
        "nickname": string,
        "source": string
    }) { }
    /**
     * 向单向好友发送消息(方便函数)
     * 可能失败
     */
    sendMsg(_this: OneBotDocking, msg: string) {
        return _this.sendMsg("private", this.obj.user_id, msg);
    }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    get source() { return this.obj.source; }
}