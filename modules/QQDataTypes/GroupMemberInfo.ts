import { OneBotDocking } from "../OneBotDocking";

/**
 * 群成员信息
 */
export class GroupMemberInfo {
    constructor(private obj: {
        "group_id": number,
        "user_id": number,
        "nickname": string,
        "card": string,
        "sex": "male" | "female" | "unknown",
        "age": number,
        "join_time": number,
        "last_sent_time": number,
        "level": "unknown",
        "role": "member" | "admin" | "owner",
        "unfriendly": boolean,
        "title": string,
        "title_expire_time": number | 0,
        "card_changeable": boolean,
        "shut_up_timestamp": number | undefined,
    }) { }
    /**
     * ```
     * 设置禁言
     * (可能无权限失败)
     * ```
     * @param time 秒,0取消
     */
    setMute(_this: OneBotDocking, time: number) {
        return _this.groupMute(this.obj.group_id, this.obj.user_id, time);
    }
    /**
     * ```
     * 方便函数
     * 获取这个群成员对应的群对象
     * ```
     */
    getGroup(_this: OneBotDocking) {
        return _this.getGroupInfoSync(this.obj.group_id);
    }
    /**
     * ```
     * 方便函数
     * 可能发送失败
     * ```
     */
    sendMsg(_this: OneBotDocking, msg: string) {
        return _this.sendMsg("private", this.obj.user_id, msg);
    }
    get group_id() { return this.obj.group_id; }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    set nickname(a) { this.obj.nickname = a; }
    get card() { return this.obj.card; }
    set card(a) { this.obj.card = a; }
    //不准确
    get sex() { return this.obj.sex; }
    //不准确
    get age() { return this.obj.age; }
    //不准确
    get join_time() { return this.obj.join_time; }
    get last_sent_time() { return this.obj.last_sent_time; }
    get level() { return this.obj.level; }
    get role() { return this.obj.role; }
    set role(a) { this.obj.role = a; }
    get unfriendly() { return this.obj.unfriendly; }
    set unfriendly(a) { this.obj.unfriendly = a; }
    get title() { return this.obj.title; }
    set title(a) { this.obj.title = a; }
    //不准确
    get title_expire_time() { return this.obj.title_expire_time; }
    get card_changeable() { return this.obj.card_changeable; }
    get shut_up_timestamp() { return this.obj.shut_up_timestamp; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}