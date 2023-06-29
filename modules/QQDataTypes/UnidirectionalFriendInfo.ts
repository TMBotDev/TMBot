import { OneBotDocking } from "../OneBotDocking";
import { Msg_Info } from "./MsgInfo";

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
     * @returns 消息ID
     */
    sendMsg(_this: OneBotDocking, msg: string | Msg_Info[]) {
        return _this.sendMsgEx("private", this.obj.user_id, msg);
    }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    get source() { return this.obj.source; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}