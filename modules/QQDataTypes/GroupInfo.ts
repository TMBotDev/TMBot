import { GroupMemberInfo, OneBotDocking, StrangerInfo } from "../OneBotDocking";
import { GroupBaseInfo } from "./GroupBaseInfo";
import { Msg_Info } from "./MsgInfo";
import { SenderInfo } from "./SenderInfo";

/**
 * 群信息(已加入群)
 */
export class GroupInfo {
    private _Owner: GroupMemberInfo | undefined;
    private _Admins = new Map<number, GroupMemberInfo>();
    private _Members = new Map<number, GroupMemberInfo>();
    private _RefreshMap = new Map<number, number>();
    constructor(private obj: {
        "group_id": number,
        "group_name": string
    }) { }
    async _init(_this: OneBotDocking) {
        _this.logger.info(`正在初始化群信息: ${this.obj.group_name}(${this.obj.group_id})...`);
        let val = await _this.getGroupMemberList(this.obj.group_id);
        let data = val.data;
        if (data == null) {
            _this.logger.info(`初始化群信息: ${this.obj.group_name}(${this.obj.group_id}) 失败!`);
            return;
        }
        (data as any[]).forEach((val) => {
            let memberInfo = new GroupMemberInfo(val);
            if (memberInfo.role == "owner") {
                this._Owner = memberInfo;
            } else if (memberInfo.role == "admin") {
                this._Admins.set(memberInfo.user_id, memberInfo);
            }
            this._Members.set(memberInfo.user_id, memberInfo);
            // logger.info(`- 群成员: ${memberInfo.card || memberInfo.nickname}(${memberInfo.user_id}) 已记录!`);
        });
        let ow = this._Owner!;
        _this.logger.info(`初始化群成员信息: ${this.obj.group_name}(${this.obj.group_id}) 成功!群主: ${ow.card || ow.nickname}(${ow.user_id}),共计 ${this._Members.size} 个群成员, ${this._Admins.size} 个管理员`);
        // logger.info(JSON.stringify(data, null, 2));
    }
    /**
     * 方便函数,快捷发送群消息
     * @returns 消息ID
     */
    sendMsg(_this: OneBotDocking, msg: string | Msg_Info[]) {
        return _this.sendMsgEx("group", this.obj.group_id, msg);
    }
    /** 建议在这里获取群人数等信息 */
    async getBaseData(_this: OneBotDocking) {
        let val = await _this.getGroupInfo(this.obj.group_id, false);
        let data = val.data;
        if (data == null) {
            _this.logger.error(`获取群聊: ${this.obj.group_id} 基础信息失败!`);
            return;
        }
        return new GroupBaseInfo(data);
    }
    async refreshMemberInfo(_this: OneBotDocking, user_id: number) {
        let time = Date.now();
        let mem = this._Members.get(user_id);
        if ((time - (this._RefreshMap.get(user_id) || time)) < 500) {
            return mem;
        }

        let val = await _this.getGroupMemberInfoEx(+this.obj.group_id, +user_id, true);
        if (!val) {
            _this.logger.error(`[${this.obj.group_name}(${this.obj.group_id})] 刷新成员 ${mem == null ? user_id : `${mem.card || mem.nickname}(${mem.user_id})`} 信息失败!`);
            return mem;
        }
        this._RefreshMap.set(user_id, time);
        // console.log(val)
        switch (val.role) {
            case "owner":
                this._Owner = val;
                break;
            case "admin":
                this._Admins.set(val.user_id, val);
                this._Members.set(val.user_id, val);
                break;
            case "member":
                this._Admins.delete(val.user_id);
                this._Members.set(val.user_id, val);

                break;
        }
        return val;
    }
    get Owner() { return this._Owner; }
    getAdmins(useArr: boolean) {
        if (useArr) {
            let obj: { [key: number]: GroupMemberInfo } = {};
            let iters = this._Admins.entries(),
                iter = iters.next();
            while (!iter.done) {
                let v = iter.value;
                obj[v[0]] = v[1];
                iter = iters.next();
            }
            return obj;
        } else { return this._Admins; }
    }
    getMembers(useArr: boolean) {
        if (useArr) {
            let obj: { [key: number]: GroupMemberInfo } = {};
            let iters = this._Members.entries(),
                iter = iters.next();
            while (!iter.done) {
                let v = iter.value;
                obj[v[0]] = v[1];
                iter = iters.next();
            }
            return obj;
        } else { return this._Members; }
    }
    get group_name() { return this.obj.group_name; }
    set group_name(a) { this.obj.group_name = a; }
    get group_id() { return this.obj.group_id; }
    set group_id(a) { this.obj.group_id = a; }
    senderGetMember(sender: SenderInfo) {
        return this._Members.get(sender.user_id);
    }
    strangerGetMember(stranger: StrangerInfo) {
        return this._Members.get(stranger.user_id);
    }
    getMember(user_id: number) {
        return this._Members.get(user_id);
    }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}