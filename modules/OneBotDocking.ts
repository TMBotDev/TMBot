import path from "path";
import { Logger, LoggerLevel } from "../tools/logger";
import { Event, WebsocketClient } from "./WebSocket";


// let logger = new Logger("Bot", LoggerLevel.Info);

export type obj = { [key: string]: any };

/**
 * @note 0	同时 status 为 ok，表示操作成功
 * @note 1	同时 status 为 async，表示操作已进入异步执行，具体结果未知
 * @note 100	参数缺失或参数无效，通常是因为没有传入必要参数，某些接口K中也可能因为参数明显无效（比如传入的 QQ 号小于等于 0，此时无需调用 酷Q 函数即可确定失败），此项和以下的 status 均为 failed
 * @note 102	酷Q 函数返回的数据无效，一般是因为传入参数有效但没有权限，比如试图获取没有加入的群组的成员列表
 * @note 103	操作失败，一般是因为用户权限不足，或文件系统异常、不符合预期
 * @note 104	由于 酷Q 提供的凭证（Cookie 和 CSRF Token）失效导致请求 QQ 相关接口失败，可尝试清除 酷Q 缓存来解决
 * @note 201	工作线程池未正确初始化（无法执行异步任务）
 */
export type retcode = number;

/**
 * @note status 字段如果是 ok 则表示操作成功，同时 retcode （返回码）会等于 0，即 酷Q 函数返回了 0。
 * @note status 字段如果是 async 则表示请求已提交异步处理，此时 retcode 为 1，具体成功或失败将无法获知。
 * @note status 字段如果是 failed 则表示操作失败，此时 retcode 有两种情况：当大于 0 时，表示是 CQHTTP 插件判断出的失败；小于 0 时，为调用 酷Q 函数的返回码，具体含义直接参考 酷Q 文档的 错误代码 和 酷Q 日志。
 */
export type status = "ok" | "failed" | "async";

export class FriendInfo {
    constructor(private obj: {
        "user_id": number,
        "nickname": string,
        "remark": string
    }) { }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    set nickname(a) { this.obj.nickname = a; }
    get remark() { return this.obj.remark; }
    set remark(a) { this.obj.remark = a; }
}

export class UnidirectionalFriendInfo {
    constructor(private obj: {
        "user_id": string,
        "nickname": string,
        "source": string
    }) { }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    get source() { return this.obj.source; }
}

export class SenderInfo {
    constructor(private obj:
        {
            "user_id": number,  //发送者 QQ 号
            "nickname": string,	//昵称
            "sex": string,	    //性别，male 或 female 或 unknown
            "age": number	    //年龄
        }) { }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    set nickname(a) { this.obj.nickname = a; }
    //不准,极为可能为unknown
    get sex() { return this.obj.sex; }
    //不准
    get age() { return this.obj.age; }
}

/**
 * 请勿长期保存
 */
export class GroupBaseInfo {
    constructor(private obj: {
        "group_id": number,
        "group_name": string,
        "member_count": number,
        "max_member_count": number
    }) { }
    get group_id() {
        return this.obj.group_id;
    }
    get group_name() { return this.obj.group_name; }
    get member_count() { return this.obj.member_count; }
    get max_member_count() { return this.obj.max_member_count; }
}

export class GroupInfo {
    private _Owner: GroupMemberInfo | undefined;
    private _Admins = new Map<number, GroupMemberInfo>();
    private _Members = new Map<number, GroupMemberInfo>();
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
        let mem = this._Members.get(user_id);
        let val = await _this.getGroupMemberInfoEx(+this.obj.group_id, +user_id, true);
        if (!val) {
            _this.logger.error(`[${this.obj.group_name}(${this.obj.group_id})] 刷新成员 ${mem == null ? user_id : `${mem.card || mem.nickname}(${mem.user_id})`} 信息失败!`);
            return mem;
        }
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
}

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
}

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

export class AnonymousInfo {
    constructor(private obj: {
        "id": number,
        "name": string,
        "flag": string
    }) { }
    get id() { return this.obj.id; }
    get name() { return this.obj.name; }
    get flag() { return this.obj.flag; }

    get isValid() { return this.obj == null; }
}

export class MsgInfo {
    constructor(private obj: {
        "message": string,
        "raw_message": string,
        "message_id": number
    }) { }
    get msg() { return this.obj.message; }
    get raw() { return this.obj.raw_message; }
    get msg_id() { return this.obj.message_id; }
}

export class FileInfo {
    constructor(private obj: {
        "id": string,
        "name": string,
        "size": number,
        "busid": number
    }) { }
    get id() { return this.obj.id; }
    get name() { return this.obj.name; }
    get size() { return this.obj.size; }
    get busid() { return this.obj.busid; }
}

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
}

export class OfflineFileInfo {
    constructor(private obj: {
        "name": string,
        "size": number,
        "url": string
    }) { }
    get name() { return this.obj.name; }
    get size() { return this.obj.size; }
    get url() { return this.obj.url; }
}

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
}

export class ForwardMsg {
    constructor(private obj: {
        "content": string,
        "sender": {
            "nickname": string,
            "user_id": number
        },
        "time": number
    }) { }
    get content() { return this.obj.content; }
    get sender() { return this.obj.sender; }
    get time() { return this.obj.time; }
}

export class FolderInfo {
    constructor(private obj: {
        "group_id": number,
        "folder_id": number,
        "folder_name": string,
        "create_time": number,
        "creator": number,
        "creator_name": string,
        "total_file_count": number
    }) { }
    get group_id() { return this.obj.group_id; }
    get folder_id() { return this.obj.folder_id; }
    get folder_name() { return this.obj.folder_name; }
    get create_time() { return this.obj.create_time; }
    get creator() { return this.obj.creator; }
    get creator_name() { return this.obj.creator_name; }
    get total_file_count() { return this.obj.total_file_count; }
}

export class GroupFileSystemInfo {
    constructor(private obj: {
        "file_count": number,
        "limit_count": number,
        "used_space": number,
        "total_space": number
    }) { }
    //文件总数
    get file_count() { return this.obj.file_count; }
    //文件上限
    get limit_count() { return this.obj.limit_count; }
    //已使用空间
    get used_space() { return this.obj.used_space; }
    //空间上限
    get total_space() { return this.obj.total_space; }
}

export enum HonorType {
    龙王 = "talkative",
    群聊之火 = "performer",
    快乐源泉 = "emotion"
}

async function SafeGetGroupInfo(this: OneBotDocking, group_id: number) {
    let group = this.getGroupInfoSync(group_id);
    if (group == null) {
        group = new GroupInfo({
            "group_id": group_id,
            "group_name": (await this.getGroupBaseInfoEx(group_id))!.group_name
        });
        await group._init(this);
        this.Groups.set(group.group_id, group);
    }
    return group;
}

async function ProcessOneBotMessage(this: OneBotDocking, obj: obj) {
    let sender = new SenderInfo(obj.sender);
    // console.log(obj.sender);


    switch (obj.message_type as "private" | "group") {
        case "private": {
            let msg = new MsgInfo({ "message": obj.message, "message_id": obj.message_id, "raw_message": obj.raw_message });
            // this.MsgIDMap.set(msg.msg_id, msg);
            this.events.onPrivateMsg.fire(
                "OneBotDockingProcess_Event_PrivateMsg",
                sender,
                obj.sub_type,
                msg
            );

            this.conf["MsgLog"] && this.logger.info(`私聊消息: ${sender.nickname} >> ${msg.msg}`);
            break;
        }
        case "group": {
            let msg = new MsgInfo({ "message": obj.message, "message_id": obj.message_id, "raw_message": obj.raw_message });
            // this.MsgIDMap.set(msg.msg_id, msg);

            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            let member: GroupMemberInfo | AnonymousInfo;
            // console.log(obj);

            if (obj.sub_type == "anonymous") {
                member = new AnonymousInfo(obj.anonymous);
            } else {
                member = (await group.refreshMemberInfo(this, sender.user_id))!;
                // member = group.senderGetMember(sender)!;
            }
            this.events.onGroupMsg.fire(
                "OneBotDockingProcess_Event_GroupMsg",
                group,
                obj.sub_type,
                member,
                msg
            );
            this.conf["MsgLog"] && this.logger.info(`[${group.group_name}(${group.group_id})] ${sender.nickname} >> ${msg.msg}`);
            break;
        }
        // case "discuss": {

        //     break;
        // }
    }
}

async function ProcessOneBotNotice(this: OneBotDocking, obj: obj) {
    // console.log(obj);
    switch (obj.notice_type as "group_upload" | "group_admin" | "group_decrease" | "group_increase" | "group_ban" | "group_recall" | "friend_add" | "friend_recall" | "notify" | "group_card" | "offline_file" | "client_status" | "essence") {
        case "group_upload": {
            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            let member = group.getMember(obj.user_id)!;
            let file = new FileInfo(obj.file);
            this.events.onGroupUploadFile.fire(
                "OneBotDockingProcess_Event_GroupUploadFile",
                group,
                member,
                file
            );
            break;
        }
        case "group_admin": {
            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            let member = group.getMember(obj.user_id)!;
            this.events.onGroupAdminChange.fire(
                "OneBotDockingProcess_Event_GroupAdminChange",
                group,
                member,
                obj.sub_type
            );
            let perms = ["Admin", "Member"];
            await group.refreshMemberInfo(this, member.user_id);
            this.conf["NoticeLog"] && this.logger.info(`[${group.group_name}(${group.group_id})] 群管理员变动: ${member.card || member.nickname}(${member.user_id}) (${perms[+(obj.sub_type == "set")]})->(${perms[+(obj.sub_type == "unset")]})`);
            break;
        }
        case "group_decrease": {
            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            let member = group.getMember(obj.user_id)!;
            let op = await this.getStrangerInfoEx(obj.operator_id);
            this.events.onGroupLeave.fire(
                "OneBotDockingProcess_Event_GroupLeave",
                group,
                obj.sub_type,
                member,
                op
            );
            if (group.Owner!.user_id == obj.user_id) {
                this.Groups.delete(obj.group_id);
                this.conf["NoticeLog"] && this.logger.info(`群聊: [${group.group_name}](${group.group_id}) 已解散`);
            } else if (obj.user_id == this.LoginInfo.user_id) {
                this.Groups.delete(group.group_id);
                this.conf["NoticeLog"] && this.logger.info(`登录号${["被踢出", "离开"][+(obj.sub_type != "kick_me")]}群聊: ${group.group_name}(${group.group_id})`);
            } else if (obj.sub_type == "leave") {
                if (member.role == "owner") {
                    (group.getAdmins(false) as Map<number, GroupMemberInfo>).delete(member.user_id);
                }
                (group.getMembers(false) as Map<number, GroupMemberInfo>).delete(member.user_id);
                this.conf["NoticeLog"] && this.logger.info(`[${group.group_name}(${group.group_id})] 成员 ${member.card || member.nickname}(${member.user_id}) 退出群聊`);
            }
            break;
        }
        case "group_increase": {
            let val = await this.getGroupInfo(obj.group_id, false);
            let data = val.data;
            if (!data) {
                this.logger.error(`无法获取群聊 <${obj.group_id}> 基础信息`);
                return;
            }
            let baseGroupInfo = new GroupBaseInfo(data);
            let strangeInfo = await this.getStrangerInfoEx(obj.user_id);
            let op = await this.getStrangerInfoEx(obj.operator_id);
            if (obj.user_id == this.LoginInfo.user_id) {
                this.conf["NoticeLog"] && this.logger.info(`登录号加入群聊: ${baseGroupInfo.group_name}(${baseGroupInfo.group_id})!`);
                let group = new GroupInfo({ "group_name": baseGroupInfo.group_name, "group_id": baseGroupInfo.group_id });
                await group._init(this);
                this.Groups.set(baseGroupInfo.group_id, group);
            } else {
                let group = await SafeGetGroupInfo.call(this, obj.group_id);
                let member = (await group.refreshMemberInfo(this, obj.user_id))!;
                this.conf["NoticeLog"] && this.logger.info(`[${group.group_name}(${group.group_id})] 加入新成员: ${strangeInfo?.nickname}(${member.user_id})`);
            }
            this.events.onGroupJoin.fire(
                "OneBotDockingProcess_Event_GroupJoin",
                baseGroupInfo,
                (obj.sub_type == "invite"),
                strangeInfo as StrangerInfo,
                op
            );
            break;
        }
        case "group_ban": {
            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            let op = (await group.refreshMemberInfo(this, obj.operator_id))!;
            if (obj.user_id == 0) {
                this.events.onGroupWholeMute.fire(
                    "OneBotDockingProcess_Event_GroupWholeMute",
                    group,
                    (obj.sub_type == "lift_ban"),
                    op
                );
            } else {
                let member = (await group.refreshMemberInfo(this, obj.user_id))!;
                this.events.onGroupMute.fire(
                    "OneBotDockingProcess_Event_GroupMute",
                    group,
                    (obj.sub_type == "lift_ban"),
                    member,
                    op
                );
            }
            break;
        }
        case "group_recall": {
            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            let member = group.getMember(obj.user_id)!;
            let op = group.getMember(obj.operator_id)!;
            let msg = await this.getMsgInfoEx(obj.message_id);
            // let msg = this.MsgIDMap.get(obj.message_id);
            if (!msg) {
                return;
            }
            this.events.onGroupRecall.fire(
                "OneBotDockingProcess_Event_GroupRecall",
                group,
                member,
                op,
                msg
            );
            break;
        }
        case "friend_add": {
            let strangerInfo = (await this.getStrangerInfoEx(obj.user_id))!;
            await this.RefreshAllFriendInfo();
            this.events.onFriendAdd.fire(
                "OneBotDockingProcess_Event_FriendAdd",
                strangerInfo
            );
            break;
        }
        case "friend_recall": {
            await this.RefreshAllFriendInfo();
            let friendInfo = this.getFriendInfoSync(obj.user_id)!;
            let msg = await this.getMsgInfoEx(obj.message_id);
            // let msg = this.MsgIDMap.get(obj.message_id);
            if (!msg) { return; }
            this.events.onFriendRecall.fire(
                "OneBotDockingProcess_Event_FriendRecall",
                friendInfo,
                msg
            );
            // let friend = 
            break;
        }
        case "notify": {
            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            switch (obj.sub_type as "poke" | "lucky_king" | "honor") {
                case "poke": {
                    if (group) {
                        let sender = (await group.refreshMemberInfo(this, obj.user_id))!;
                        let target = (await group.refreshMemberInfo(this, obj.target_id))!;
                        this.events.onGroupPoke.fire(
                            "OneBotDockingProcess_Event_GroupPoke",
                            group,
                            sender,
                            target
                        );
                    } else {
                        await this.RefreshAllFriendInfo();
                        let sender = this.getFriendInfoSync(obj.user_id)!;
                        this.events.onFriendPoke.fire(
                            "OneBotDockingProcess_Event_FriendPoke",
                            sender
                        );
                    }
                    break;
                }
                case "lucky_king": {
                    let member = (await group!.refreshMemberInfo(this, obj.user_id))!;
                    let target = (await group!.refreshMemberInfo(this, obj.target_id))!;
                    this.events.onGroupRedPacketLuckKing.fire(
                        "OneBotDockingProcess_Event_GroupRedPacketLuckKing",
                        group!,
                        member,
                        target
                    );
                    break;
                }
                case "honor": {
                    let member = (await group!.refreshMemberInfo(this, obj.user_id))!;
                    this.events.onGroupHonorChanged.fire(
                        "OneBotDockingProcess_Event_GroupHonorChanged",
                        group!,
                        obj.honor_type,
                        member
                    );
                    break;
                }
            }
            break;
        }
        case "group_card": {
            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            let member = group.getMember(obj.user_id)!;
            this.events.onGroupCardChanged.fire(
                "OneBotDockingProcess_Event_GroupCardChanged",
                group,
                member,
                obj.card_new
            );
            member.card = obj.card_new;
            break;
        }
        case "offline_file": {
            let stranger = (await this.getStrangerInfoEx(obj.user_id))!;
            let file = new OfflineFileInfo(obj.file);
            this.events.onReceiveOfflineFile.fire(
                "OneBotDockingProcess_Event_ReceiveOfflineFile",
                stranger,
                file
            );
            break;
        }
        case "client_status": {
            let device = new DeviceInfo(obj.client);
            this.events.onClientStatusChanged.fire(
                "OneBotDockingProcess_Event_ClientStatusChanged",
                device,
                obj.online
            );
            break;
        }
        case "essence": {
            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            if (!group) { return; }
            let msg = await this.getMsgInfoEx(obj.message_id);
            // let msg = this.MsgIDMap.get(obj.message_id);
            if (!msg) { return; }
            let sender = (await group.refreshMemberInfo(this, obj.sender_id))!;
            let op = (await group.refreshMemberInfo(this, obj.operator_id))!;
            this.events.onGroupEssenceMsgChanged.fire(
                "OneBotDockingProcess_Event_GroupEssenceMsgChanged",
                group,
                obj.sub_type,
                sender,
                op,
                msg
            )
            break;
        }
    }
}

async function ProcessOneBotRequest(this: OneBotDocking, obj: obj) {
    // console.log(obj);
    switch (obj.request_type as "friend" | "group") {
        case "friend": {
            let strangerInfo = (await this.getStrangerInfoEx(obj.user_id))!;
            this.events.onFriendRequestAdd.fire(
                "OneBotDockingProcess_Event_FriendRequestAdd",
                strangerInfo,
                obj.comment,
                obj.flag
            );
            break;
        }
        case "group": {
            let groupBaseInfo = (await this.getGroupBaseInfoEx(obj.group_id))!;
            let strangerInfo = (await this.getStrangerInfoEx(obj.user_id))!;
            this.events.onGroupRequestJoin.fire(
                "OneBotDockingProcess_Event_GroupRequestJoin",
                groupBaseInfo,
                (obj.sub_type == "invite"),
                strangerInfo,
                obj.comment,
                obj.flag
            );
            break;
        }
    }
}

// class ShareData {
//     private map = new Map<string, Map<any, any>>();
//     constructor() { }
//     getShareData<T>(str: string) {
//         return this.map.get(str) as T | undefined;
//     }
//     delShareData(str: string) {
//         let old = this.map.get(str);
//         this.map.delete(str);
//         return old;
//     }
//     setShareData(str: string, data: any) {
//         this.map.set(str, data);
//         return true;
//     }
//     clear() { return this.map.clear(); }
// }

export class OneBotDocking {
    private _LoginInfo = { "user_id": -1, "nickname": "Unknown" };
    // public MsgIDMap = new Map<number, MsgInfo>();
    private _RequestCallbacks: { [key: string]: ((obj: { "status": status, "retcode": retcode, "data": null | any }) => void) } = {};
    private isClosing: boolean = false;
    private _Friends = new Map<number, FriendInfo>();
    private _Groups = new Map<number, GroupInfo>();
    private _IsInitd = false;//是否成功初始化

    // public ShareData = new ShareData();

    private _events = {
        "onRawMessage": new Event<(rawInfo: string, ori: (isExecute: boolean, raw: string) => void) => void>(),
        "onInitSuccess": new Event<() => void>(),
        "onClientClose": new Event<() => void>(),
        "onClientStatusChanged": new Event<(device: DeviceInfo, online: boolean) => void>(),
        "onPrivateMsg": new Event<(senderInfo: SenderInfo, sub_type: "friend" | "group" | "discuss" | "other", msgInfo: MsgInfo) => void>(),
        "onGroupMsg": new Event<(groupInfo: GroupInfo, sub_type: "normal" | "anonymous" | "notice", groupMemberInfo: GroupMemberInfo | AnonymousInfo, msgInfo: MsgInfo) => void>(),
        // "onDiscussMsg": new Event<(discussInfo: DiscussInfo, senderInfo: SenderInfo, msgInfo: MsgInfo) => void>(),
        "onGroupUploadFile": new Event<(groupInfo: GroupInfo, groupMemberInfo: GroupMemberInfo, fileInfo: FileInfo) => void>(),
        "onGroupAdminChange": new Event<(groupInfo: GroupInfo, memberInfo: GroupMemberInfo, sub_type: "set" | "unset") => void>(),
        /**
         * @note leave//主动离开,kick//被踢,//kick_me//登录号被踢
         */
        "onGroupLeave": new Event<(groupInfo: GroupInfo, sub_type: "leave" | "kick" | "kick_me", memberInfo: GroupMemberInfo, operator: StrangerInfo | undefined) => void>(),
        "onGroupJoin": new Event<(groupInfo: GroupBaseInfo, isInvite: boolean, strangerInfo: StrangerInfo, operator: StrangerInfo | undefined) => void>(),
        "onGroupWholeMute": new Event<(group: GroupInfo, isUnMute: boolean, operator: GroupMemberInfo) => void>(),
        "onGroupMute": new Event<(groupInfo: GroupInfo, isUnMute: boolean, memberInfo: GroupMemberInfo, operator: GroupMemberInfo) => void>(),
        "onGroupRecall": new Event<(groupInfo: GroupInfo, memberInfo: GroupMemberInfo, operator: GroupMemberInfo, msg: MsgInfo) => void>(),
        "onFriendAdd": new Event<(strangerInfo: StrangerInfo) => void>(),
        "onFriendRecall": new Event<(friendInfo: FriendInfo, msg: MsgInfo) => void>(),
        "onFriendRequestAdd": new Event<(strangerInfo: StrangerInfo, comment: string, flag: string) => void>(),
        "onGroupRequestJoin": new Event<(groupInfo: GroupBaseInfo, isInviteSelf: boolean, strangerInfo: StrangerInfo, comment: string, flag: string) => void>(),
        "onGroupPoke": new Event<(group: GroupInfo, sender: GroupMemberInfo, target: GroupMemberInfo) => void>(),
        "onFriendPoke": new Event<(sender: FriendInfo) => void>(),
        "onGroupRedPacketLuckKing": new Event<(group: GroupInfo, sender: GroupMemberInfo, target: GroupMemberInfo) => void>(),
        "onGroupHonorChanged": new Event<(group: GroupInfo, honor: HonorType, member: GroupMemberInfo) => void>(),
        "onGroupCardChanged": new Event<(group: GroupInfo, member: GroupMemberInfo, card: string) => void>(),
        "onReceiveOfflineFile": new Event<(stranger: StrangerInfo, offlineFile: OfflineFileInfo) => void>(),
        "onGroupEssenceMsgChanged": new Event<(group: GroupInfo, sub_type: "add" | "delete", sender: GroupMemberInfo, operator: GroupMemberInfo, msg: MsgInfo) => void>()
    }

    public logger: Logger;
    constructor(
        public Name: string,
        private wsc: WebsocketClient,
        public conf: { [key: string]: any }
    ) {
        this._Init();
        this.logger = new Logger(Name, 4);
        if (!!(conf["LogFile"] || "").trim()) {
            this.logger.setFile(path.join("./logs", conf["LogFile"]));
        }
    }

    get Client() { return this.wsc; }
    get events() { return this._events; }
    get LoginInfo() { return this._LoginInfo; }
    get Groups() { return this._Groups; }
    get Friends() { return this._Friends; }

    SafeClose(code: number = 1000) {
        this.isClosing = true;
        let closeTime = Date.now();
        let sid = setInterval(() => {
            if (Object.keys(this._RequestCallbacks).length == 0) {
                this.Client.close(code);
                clearInterval(sid);
            }
            if ((Date.now() - closeTime) >= 1000 * 60) {
                this.logger.warn("关闭操作超时!");
                this.Client.close(code);
            }
        }, 100);
    }

    _Init() {
        this._IsInitd = false;
        this._RequestCallbacks = {};
        this.wsc.events.onStart.on(async () => {
            // this.sendMsg("group", 1073980007, "复读机已启动");
            // this._SendReqPro("get_group_member_list", {
            //     "group_id": 1073980007
            // }).then((val) => {
            //     console.log(val);

            // });
            if ((await this._loadLoginInfo()) &&
                (await this._loadFriends()) &&
                (await this._loadGroupsInfo())) {
                this._events.onInitSuccess.fire("OneBotDockingProcess_Event_InitSuccess");
                this.logger.info(`基础信息初始化成功!`);
                this._IsInitd = true;
            } else {
                this.logger.fatal(`基础信息初始化失败!`);
            }
        });
        this.wsc.events.onMsg.on((msg, isBuff) => {
            if (isBuff) { this.logger.warn("暂不支持Buffer信息!"); return; }
            let msg_ = msg as string, b = true;
            this.events.onRawMessage.fire(
                "OneBotDockingProcess_Event_RawMessage",
                msg_,
                (boo, msg) => {
                    b = (b ? boo : b);
                    if (boo) { msg_ = msg }
                }
            );
            if (!b) { return; }
            let obj: obj = {};
            try { obj = JSON.parse(msg_); } catch (e) {
                this.logger.error("无法进行解析工作! ", (e as Error).stack);
                this.logger.error("WorkMessage:", msg_);
                return;
            }
            if (obj.echo != null) {
                let echo = obj.echo as string;
                if (this._RequestCallbacks[echo]) {
                    try {
                        this._RequestCallbacks[echo](obj as { "status": status, "retcode": retcode, "data": null | any });
                        delete this._RequestCallbacks[echo];
                    } catch (e) { this.logger.error(`Error in RequestCallback: ${(e as Error).stack}`); }
                }
                return;
            }
            if (this.isClosing) { return; }
            // console.log(obj)
            switch (obj.post_type as "message" | "notice" | "request") {
                case "message": {
                    ProcessOneBotMessage.call(this, obj);
                    break;
                }
                case "notice": {
                    ProcessOneBotNotice.call(this, obj);
                    break;
                }
                case "request": {
                    ProcessOneBotRequest.call(this, obj);
                    break;
                }
            }
        });
        this.wsc.events.onClose.on((code, desc) => {
            // this.logger.warn(`WS已断开!退出码: ${code}, DESC:${desc}`);
            this._events.onClientClose.fire(
                "OneBotDockingProcess_Event_ClientClose"
            );
        });
        this.events.onRawMessage.on((raw, ori) => {
            return ori(true, raw);
        });
    }
    _SendRequest(type: string, params: { [key: string]: any }, func: (obj: { "status": status, "retcode": retcode, "data": null | any }) => void) {
        if (this.isClosing) { return; }
        let id = Math.random().toString(16).slice(2);
        this._RequestCallbacks[id] = func;
        let content = {
            "action": type,
            "params": params,
            "echo": id
        };
        this.wsc.send(JSON.stringify(content));
    }
    _SendReqPro(type: string, params: { [key: string]: any }) {
        let pro = new Promise<{ "status": status, "retcode": retcode, "data": null | any }>((outMsg, outErr) => {
            this._SendRequest(type, params, (obj) => {
                outMsg(obj);
            });
        });
        return pro;
    }
    async _loadLoginInfo() {
        let val = await this.getLoginInfo();
        let data = val.data;
        if (data == null) {
            this.logger.error(`登录号信息获取失败!`);
            return false;
        }
        this._LoginInfo = {
            "user_id": data.user_id,
            "nickname": data.nickname
        }
        this.logger.info(`登陆号信息获取完成: ${data.nickname}(${data.user_id})`);
        return true;
    }
    async _loadFriends() {
        this.logger.info("正在加载好友列表...");
        this._Friends.clear();
        let val = await this.getFriendList();
        let data = val.data as ({
            "ClassType": "FriendData",
            "user_id": number,
            "nickname": string,
            "remark": string
        }[]) | null;
        if (data == null) {
            this.logger.error("获取好友列表失败!");
            return false;
        } else {
            let i = 0;
            data.forEach((val) => {
                this._Friends.set(val.user_id, new FriendInfo(val));
                this.logger.info(`加载好友: ${val.remark || val.nickname}(${val.user_id})`);
                i++;
            });
            this.logger.info(`加载完成!共 ${i} 个好友!`);
        }
        return true;
    }
    async _loadGroupsInfo() {
        this.logger.info("正在加载群聊信息...");
        this._Groups.clear();
        let val = await this.getGroupList();
        let data = val.data as any[] | null;
        if (data == null) {
            this.logger.error(`获取群聊列表失败!`);
            return false;
        }
        for (let i = 0, l = data.length; i < l; i++) {
            let val = data[i];
            if (!this._Groups.has(val.group_id)) {
                let groupInfo = new GroupInfo(val);
                await groupInfo._init(this);
                this._Groups.set(groupInfo.group_id, groupInfo);
            }
        }
        return true;
    }

    groupBaseInfoGetGroupInfo(base: GroupBaseInfo) {
        return this._Groups.get(base.group_id);
    }

    getGroupInfoSync(group_id: number) {
        return this._Groups.get(group_id);
    }

    getFriendInfoSync(user_id: number) {
        return this._Friends.get(user_id);
    }

    async RefreshAllFriendInfo() {
        let data = (await this.getFriendList()).data as ({
            "ClassType": "FriendData",
            "user_id": number,
            "nickname": string,
            "remark": string
        }[]) | null;
        if (data == null) {
            this.logger.error(`刷新好友列表失败!`);
            return;
        }
        this._Friends.clear();
        data.forEach((val) => {
            let friendInfo = new FriendInfo(val);
            this._Friends.set(friendInfo.user_id, friendInfo);
        });
        return true;
    }

    async getGroupBaseInfoEx(group_id: number) {
        let data = (await this.getGroupInfo(group_id, true)).data;
        if (!data) { return; }
        return new GroupBaseInfo(data);
    }

    async getStrangerInfoEx(user_id: number, no_cache: boolean = true) {
        let val = await this.getStrangerInfo(user_id, no_cache);
        let data = val.data;
        if (data == null) { return; }
        return new StrangerInfo(data);
    }

    async getGroupMemberInfoEx(group_id: number, user_id: number, no_cache: boolean = true) {
        let val = await this.getGroupMemberInfo(group_id, user_id, no_cache);
        let data = val.data;
        if (data == null) { return; }
        // console.log(data);
        return new GroupMemberInfo(data);
    }

    async getMsgInfoEx(msg_id: number) {
        let data = (await this.getMsg(msg_id)).data;
        // console.log(data);
        if (!data) { return; }
        return new MsgInfo(data);
    }

    //#region API
    // https://github.com/ishkong/go-cqhttp-docs/tree/main/docs/api

    async sendMsg(type: "private" | "group" | 0 | 1, id: number, msg: string) {
        let Type: "private" | "group" | "discuss";
        if (typeof (type) == "number") {
            Type = ["private", "group", "discuss"][type] as "private" | "group" | "discuss";
        } else {
            Type = type;
        }
        let json: { [key: string]: any } = {
            "message_type": Type,
            "message": msg
        };
        switch (Type) {
            case "private": json["user_id"] = id; break;
            case "group": json["group_id"] = id; break;
            case "discuss": json["discuss_id"] = id; break;
        }
        return await this._SendReqPro("send_msg", json);
    };
    async deleteMsg(msg_id: number) {
        return await this._SendReqPro("delete_msg", { "message_id": msg_id });
    }
    async getMsg(msg_id: number) {
        return await this._SendReqPro("get_msg", { "message_id": msg_id });
    }
    async getForwardMsgs(id: string) {
        return await this._SendReqPro("get_forward_msg", { "message_id": id });
    }
    /**
     * @param user_id 
     * @param count Max 10
     * @deprecated 机器人框架未支持
     */
    async sendLike(user_id: number, count: number) {
        count = (count > 10 ? 10 : (count < 1 ? 1 : count));
        return await this._SendReqPro("send_like", { "user_id": user_id, "times": count });
    }
    async groupKick(group_id: number, user_id: number, reject_add_request = false) {
        return await this._SendReqPro("set_group_kick", { "group_id": group_id, "user_id": user_id, "reject_add_request": reject_add_request });
    }
    /**
     * @param group_id 
     * @param user_id 
     * @param duration 秒,0代表取消
     */
    async groupMute(group_id: number, user_id: number, duration: number = 60 * 30) {
        return await this._SendReqPro("set_group_ban", { "group_id": group_id, "user_id": user_id, "duration": duration });
    }
    async groupMuteAnonymous(group_id: number, anonymous_flag: string, duration: number = 60 * 30) {
        return this._SendReqPro("set_group_anonymous_ban", { "group_id": group_id, "anonymous_flag": anonymous_flag, "duration": duration });
    }
    async setAllMute(group_id: number, isMute: boolean = true) {
        return await this._SendReqPro("set_group_whole_ban", { "group_id": group_id, "enable": isMute });
    }
    async setGroupAdmin(group_id: number, user_id: number, enable: boolean = true) {
        return await this._SendReqPro("set_group_admin", { "group_id": group_id, "user_id": user_id, "enable": enable });
    }
    /**
     * @deprecated 机器人框架未支持
     */
    async setGroupAnonymous(group_id: number, enable: boolean = true) {
        return await this._SendReqPro("set_group_anonymous", { group_id, enable });
    }
    /**
     * @param group_id 
     * @param user_id 
     * @param card 群名片内容，不填或空字符串表示删除群名片
     */
    async setGroupCard(group_id: number, user_id: number, card: string = "") {
        return await this._SendReqPro("set_group_card", { group_id, user_id, card });
    }
    async setGroupName(group_id: number, group_name: string) {
        return await this._SendReqPro("set_group_name", { group_id, group_name });
    }
    /**
     * @param group_id 
     * @param is_dismiss 是否解散，如果登录号是群主，则仅在此项为 true 时能够解散
     */
    async leaveGroup(group_id: number, is_dismiss: boolean = false) {
        return await this._SendReqPro("set_group_leave", { group_id, is_dismiss });
    }
    /**
     * @param group_id 
     * @param user_id 
     * @param special_title 专属头衔，不填或空字符串表示删除专属头衔
     * @param duration 专属头衔有效期，单位秒，-1 表示永久，不过此项似乎没有效果，可能是只有某些特殊的时间长度有效，有待测试
     */
    async setGroupSpecialTitle(group_id: number, user_id: number, special_title: string = "", duration: number = -1) {
        return await this._SendReqPro("set_group_special_title", { group_id, user_id, special_title, duration });
    }
    async sendGroupSign(group_id: number) {
        return await this._SendReqPro("send_group_sign", { group_id });
    }
    /**
     * @param discuss_id 
     * @deprecated QQ已无群组
     */
    async leaveDiscuss(discuss_id: number) {
        return await this._SendReqPro("set_discuss_leave ", { discuss_id });
    }
    /**
     * @param flag 
     * @param approve 是否同意请求
     * @param remark 添加后的好友备注（仅在同意时有效）
     * @returns 
     */
    async processFriendAddRequest(flag: string, approve: boolean = true, remark: string = "") {
        return await this._SendReqPro("set_friend_add_request", { flag, approve, remark });
    }
    /**
     * @param flag 
     * @param sub_type add 或 invite，请求类型（需要和上报消息中的 sub_type 字段相符）
     * @param approve 是否同意请求／邀请
     * @param reason 拒绝理由（仅在拒绝时有效）
     * @returns 
     */
    async processGroupMemberAddRequest(flag: string, sub_type: "add" | "invite", approve: boolean = true, reason: undefined | string = undefined) {
        return await this._SendReqPro("set_group_add_request", { flag, sub_type, approve, reason });
    }
    async getLoginInfo() {
        return await this._SendReqPro("get_login_info", {});
    }
    /**
     * 注意 该API只有企点协议可用 
     */
    async getQiDianAccountInfo() {
        return await this._SendReqPro("qidian_get_account_info", {});
    }
    /**
     * @param nickname 名称
     * @param company 公司
     * @param email 邮箱
     * @param college 学校
     * @param personal_note 个人说明
     */
    async setQQProfile(nickname: string, company: string, email: string, college: string, personal_note: string) {
        return await this._SendReqPro("set_qq_profile", {});
    }
    async getStrangerInfo(user_id: number, no_cache: boolean = false) {
        return await this._SendReqPro("get_stranger_info", { user_id, no_cache });
    }
    async getFriendList() {
        return await this._SendReqPro("get_friend_list", {});
    }
    async getUnidirectionalFriendList() {
        return await this._SendReqPro("get_unidirectional_friend_list", {});
    }
    async getGroupList() {
        return await this._SendReqPro("get_group_list", {});
    }
    /**
     * @param group_id 
     * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
     * @returns 
     */
    async getGroupInfo(group_id: number, no_cache: boolean = false) {
        return await this._SendReqPro("get_group_info", { group_id, no_cache });
    }
    /**
     * @param group_id 
     * @param user_id 
     * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
     */
    async getGroupMemberInfo(group_id: number, user_id: number, no_cache: boolean = false) {
        return await this._SendReqPro("get_group_member_info", { group_id, user_id, no_cache });
    }
    async getGroupMemberList(group_id: number) {
        return await this._SendReqPro("get_group_member_list", { group_id });
    }
    async getGroupHonorInfo(group_id: number, type: "all" | "talkative " | "performer" | "legend" | "strong_newbie" | "emotion") {
        return await this._SendReqPro("get_group_honor_info", { group_id, type });
    }
    /**
     * @deprecated 机器人框架未支持
     */
    async getCookies() {
        return await this._SendReqPro("get_cookies", {});
    }
    /**
     * @deprecated 机器人框架未支持
     */
    async getCsrfToken() {
        return await this._SendReqPro("get_csrf_token", {});
    }
    /**
    * @deprecated 机器人框架未支持
    */
    async getCredentials() {
        return await this._SendReqPro("get_credentials", {});
    }
    /**
    * @deprecated 机器人框架未支持
    */
    async getRecord(file: string, out_format: "mp3" | "amr" | "wma" | "m4a" | "spx" | "ogg" | "wav" | "flac", full_path: boolean = false) {
        return await this._SendReqPro("get_record", { file, out_format, full_path });
    }
    async getImage(file: string) {
        return await this._SendReqPro("get_image", { file });
    }
    async canSendImage() {
        return await this._SendReqPro("can_send_image", {});
    }
    async canSendRecord() {
        return await this._SendReqPro("can_send_record", {});
    }
    async getStatus() {
        return await this._SendReqPro("get_status", {});
    }
    async getVersionInfo() {
        return await this._SendReqPro("get_version_info", {});
    }
    async setRestart(delay: number = 0) {
        return await this._SendReqPro("set_restart", { delay });
    }
    /**
     * @deprecated 机器人框架未支持
     */
    async setRestartPlugin(delay: number = 0) {
        return await this._SendReqPro("set_restart_plugin", { delay });
    }
    /**
    * @deprecated 机器人框架未支持
    */
    async cleanDataDir(data_dir: string) {
        return await this._SendReqPro("clean_data_dir", { data_dir });
    }
    /**
    * @deprecated 机器人框架未支持
    */
    async cleanCache() {
        return await this._SendReqPro("clean_cache", {});
    }
    /**
    * @deprecated 机器人框架未支持
    */
    async cleanPluginLog() {
        return await this._SendReqPro("clean_plugin_log", {});
    }
    async setGroupPortrait(group_id: number, file: string, cache: boolean = true) {
        return await this._SendReqPro("set_group_portrait", { group_id, file, "cache": +cache });
    }
    /**
     * @note ```
     * invited_requests	InvitedRequest[] 邀请消息列表
     * join_requests	JoinRequest[]	 进群消息列表
     * 
     * -----------------------------------------
     * |              InvitedRequest           |
     * |----------------------------------------
     * |字段         |类型   |说明             |
     * |request_id   |int64  |请求ID           |
     * |invitor_uin  |int64  |邀请者           |
     * |invitor_nick |string |邀请者昵称       |
     * |group_id     |int64  |群号             |
     * |group_name   |string |群名             |
     * |checked	     |bool   |是否已被处理     |
     * |actor	     |int64  |处理者, 未处理为0|
     * -----------------------------------------
     * 
     * --------------------------------------------
     * |               JoinRequest                |
     * |-------------------------------------------
     * |字段	       |类型   | 说明             |
     * |request_id     |int64  |请求ID            |
     * |requester_uin  |int64  |请求者ID          |
     * |requester_nick |string |请求者昵称        |
     * |message        |string |验证消息          |
     * |group_id       |int64  |群号              |
     * |group_name     |string |群名              |
     * |checked        |bool   |是否已被处理      |
     * |actor          |int64  |处理者, 未处理为0 |
     * --------------------------------------------
     * ```
     */
    async getGroupSystemMsg() {
        return await this._SendReqPro("get_group_system_msg", {});
    }
    /**
     * @param user_id 
     * @param file 本地文件目录
     * @param name 
     */
    async uploadPrivateFile(user_id: number, file: string, name: string) {
        return await this._SendReqPro("upload_private_file", { user_id, file, name });
    }
    /**
     * @param group_id 
     * @param file 
     * @param name 
     * @param folder 父目录id
     */
    async uploadGroupFile(group_id: number, file: string, name: string, folder: string | undefined) {
        return await this._SendReqPro("upload_group_file", { group_id, file, folder });
    }
    async getGroupFileSystemInfo(group_id: number) {
        return await this._SendReqPro("get_group_file_system_info", { group_id });
    }
    /**
     * @note ```
     * (自行使用new套入对接对象)
     * data: null |
     * files	File[]	文件列表
     * folders	Folder[]	文件夹列表
     * ```
     */
    async getGroupRootFiles(group_id: number) {
        return await this._SendReqPro("get_group_root_files", { group_id });
    }
    /**
     * @note ```
     *  (自行使用new套入对接对象)
     * data: null |
     * 字段	类型	说明
     * files	FileProInfo[]	文件列表
     * folders	FolderInfo[]	文件夹列表
     * ```
     */
    async getGroupFilesByFolder(group_id: number, folder_id: string) {
        return await this._SendReqPro("get_group_files_by_folder", { group_id, folder_id });
    }
    /**
     * @param group_id 
     * @param name 
     * @param parent_id 仅能为 /
     * @returns 
     */
    async createGroupFileFolder(group_id: number, name: number, parent_id: string = "/") {
        return await this._SendReqPro("create_group_file_folder", { group_id, name, parent_id });
    }
    async deleteGroupFolder(group_id: number, folder_id: string) {
        return await this._SendReqPro("delete_group_folder", { group_id, folder_id });
    }
    async deleteGroupFile(group_id: number, file_id: string, busid: string) {
        return await this._SendReqPro("delete_group_file", { group_id, file_id, busid });
    }
    async getGroupFileUrl(group_id: number, file_id: string, busid: string) {
        return await this._SendReqPro("get_group_file_url", { group_id, file_id, busid });
    }
    async getGroupAtAllRemain(group_id: number) {
        return await this._SendReqPro("get_group_at_all_remain", { group_id });
    }
    async downloadFile(url: string, thread_count: number, headers: string | string[]) {
        return await this._SendReqPro("download_file", { url, thread_count, headers });
    }
    async getOnlineClients(no_cache: boolean = false) {
        return await this._SendReqPro("get_online_clients", { no_cache });
    }
    async getGroupMsgHistory(group_id: number) {
        return await this._SendReqPro("get_group_msg_history", { group_id });
    }
    async setEssenceMsg(message_id: number) {
        return await this._SendReqPro("set-essence_msg", { message_id });
    }
    async deleteEssenceMsg(message_id: number) {
        return await this._SendReqPro("delete_essence_msg", { message_id });
    }
    /**
     * @note ```
     * data: null |
     * {
     * sender_id:	int64	发送者QQ 号
     * sender_nick:	string	发送者昵称
     * sender_time:	int64	消息发送时间
     * operator_id:	int64	操作者QQ 号
     * operator_nick:	string	操作者昵称
     * operator_time:	int64	精华设置时间
     * message_id:	int32	消息ID
     * }[]
     * ```
     */
    async getEssenceMsgList(group_id: number) {
        return await this._SendReqPro("get_essence_msg_list", { group_id });
    }
    /**
     * @note ```
     * data: null |
     * {
     * "level": number//安全等级, 1: 安全 2: 未知 3: 危险
     * }
     * ```
     */
    async checkUrlSafely(url: string) {
        return await this._SendReqPro("check_url_safely", { url });
    }
    async deleteUnidirectionalFriend(user_id: number) {
        return await this._SendReqPro("delete_unidirectional_friend", { user_id });
    }
    //#endregion
}