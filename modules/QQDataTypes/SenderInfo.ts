import { OneBotDocking } from "../OneBotDocking";
import { Msg_Info } from "./MsgInfo";

/**
 * 发送者信息
 */
export class SenderInfo {
    constructor(private obj:
        {
            "user_id": number,  //发送者 QQ 号
            "nickname": string,	//昵称
            "sex": string,	    //性别，male 或 female 或 unknown
            "age": number,	    //年龄
            "isGroupMember": boolean,
            "isGuildMember": boolean
        }) { }
    /**
     * 非常用变量 是否为群聊成员
     */
    get _isGroupMember() { return this.obj.isGroupMember; }
    /**
     * 非常用变量 是否为频道成员
     */
    get _isGuildMember() { return this.obj.isGuildMember; }
    /**获取好友对象(可能失败)*/
    getFriend(_this: OneBotDocking) {
        return _this.getFriendInfoSync(this.obj.user_id);
    }
    /**
     * 向TA发送消息(方便函数)
     * 极有可能失败,谨慎使用
     * @returns 消息ID
     */
    sendMsg(_this: OneBotDocking, msg: string | Msg_Info[]) {
        if (this.obj.isGuildMember) { return new Promise<undefined>(r => r(undefined)); }
        return _this.sendMsgEx(this.obj.isGroupMember ? "group" : "private", this.obj.user_id, msg);
    }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    set nickname(a) { this.obj.nickname = a; }
    //不准,极为可能为unknown
    get sex() { return this.obj.sex; }
    //不准
    get age() { return this.obj.age; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}