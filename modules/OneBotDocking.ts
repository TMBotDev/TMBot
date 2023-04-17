import path from "path";
import { Version } from "../app";
import { Logger } from "../tools/logger";
import { WebsocketClient } from "./WebSocket";
import { Event } from "./Event";
import { AnonymousInfo } from "./QQDataTypes/AnonymousInfo";
import { DeviceInfo } from "./QQDataTypes/DeviceInfo";
import { FileInfo } from "./QQDataTypes/FileInfo";
import { FriendInfo } from "./QQDataTypes/FriendInfo";
import { GroupBaseInfo } from "./QQDataTypes/GroupBaseInfo";
import { GroupInfo } from "./QQDataTypes/GroupInfo";
import { GroupMemberInfo } from "./QQDataTypes/GroupMemberInfo";
import { HonorType } from "./QQDataTypes/HonorType";
import { MsgInfo } from "./QQDataTypes/MsgInfo";
import { OfflineFileInfo } from "./QQDataTypes/OfflineFileInfo";
import { SenderInfo } from "./QQDataTypes/SenderInfo";
import { StrangerInfo } from "./QQDataTypes/StrangerInfo";


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

/**
 * 截断超出的字符串,阶段部分用"..."表示
 */
function TruncateString(text: string, size: number) {
    if (text.length > size) {
        text = text.substring(0, size) + "...";
    }
    return text;
}

function CQCodeDataToObj(e: string) {
    let obj: obj = {};
    let arr = e.split(",");
    arr.forEach((v) => {
        let arr = v.split("=");
        obj[arr[0]] = arr[1];
    });
    return obj;
}

/**
 * 自动替换CQ码
 */
async function AutoReplaceCQCode(msg: string, _this: OneBotDocking, fn: (name: string, data: obj) => Promise<string>) {
    let CQCodeIndex = msg.indexOf("[CQ:");
    while (CQCodeIndex != -1) {
        let CCLIndex = CQCodeIndex + 4;
        let name = "", _End = false;
        while (msg[CCLIndex] != "]" && msg[CCLIndex] != undefined) {
            if (msg[CCLIndex] == ",") { _End = true; }
            if (!_End) {
                name += msg[CCLIndex];
            }
            CCLIndex += 1;
        }
        CCLIndex += 1;
        let str = msg.substring(CQCodeIndex, CCLIndex).replace(/[ ]/g, "");
        let data = str.substring((4 + name.length), (str.length - 1));
        if (!!data) { data = data.substring(1); }
        name = name[0].toUpperCase() + name.substring(1);
        msg = msg.substring(0, CQCodeIndex) + `§d[${await fn(name, CQCodeDataToObj(data))}]§r` + msg.substring(CCLIndex);
        CQCodeIndex = msg.indexOf("[CQ:");
    }
    return msg;
}

async function ProcessOneBotMessage(this: OneBotDocking, obj: obj) {
    let sender = new SenderInfo(obj.sender);
    // console.log(obj.sender);


    switch (obj.message_type as "private" | "group") {
        case "private": {
            let msg = new MsgInfo({ "message": obj.message, "message_id": obj.message_id, "raw_message": obj.raw_message });
            // this.MsgIDMap.set(msg.msg_id, msg);
            // console.log(JSON.stringify(obj.raw_message, null, 2));
            this.events.onPrivateMsg.fire(
                "OneBotDockingProcess_Event_PrivateMsg",
                obj.time * 1000,
                sender,
                obj.sub_type,
                msg
            );

            this.conf["MsgLog"] && this.logger.info(`私聊消息: ${sender.nickname} >> ${AutoReplaceCQCode(TruncateString(msg.originalContent, 100), this, async (name, _d) => name)}`);
            break;
        }
        case "group": {
            let msg = new MsgInfo({ "message": obj.message, "message_id": obj.message_id, "raw_message": obj.raw_message });
            // this.MsgIDMap.set(msg.msg_id, msg);

            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            let member: GroupMemberInfo | AnonymousInfo;
            // console.log(obj);

            if (obj.sub_type == "anonymous") {
                member = new AnonymousInfo(obj.group_id, obj.anonymous);
            } else {
                member = (await group.refreshMemberInfo(this, sender.user_id))!;
                // member = group.senderGetMember(sender)!;
            }
            this.events.onGroupMsg.fire(
                "OneBotDockingProcess_Event_GroupMsg",
                obj.time * 1000,
                group,
                obj.sub_type,
                member,
                msg
            );
            this.conf["MsgLog"] &&
                this.logger.info(`[${group.group_name}(${group.group_id})] ${sender.nickname} >> ${TruncateString(await AutoReplaceCQCode(msg.originalContent, this, async (name, data) => {
                    if (name.toLowerCase() == "at") {
                        let user = (await group.refreshMemberInfo(this, +data["qq"]));
                        if (user == null) {
                            name = "@" + data["qq"];
                        } else { name = "@" + user.nickname; }
                    }
                    return `§e${name}§d`;
                }), 100)}`);
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
                obj.time * 1000,
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
                obj.time * 1000,
                group,
                member,
                obj.sub_type
            );
            let perms = ["Admin", "Member"];
            await group.refreshMemberInfo(this, member.user_id);
            this.conf["NoticeLog"] && this.logger.info(`[${group.group_name} (${group.group_id})]群管理员变动: ${member.card || member.nickname} (${member.user_id}) (${perms[+(obj.sub_type == "set")]}) -> (${perms[+(obj.sub_type == "unset")]})`);
            break;
        }
        case "group_decrease": {
            let group = await SafeGetGroupInfo.call(this, obj.group_id);
            let member = group.getMember(obj.user_id)!;
            let op = await this.getStrangerInfoEx(obj.operator_id);
            this.events.onGroupLeave.fire(
                "OneBotDockingProcess_Event_GroupLeave",
                obj.time * 1000,
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
                this.conf["NoticeLog"] && this.logger.info(`登录号${["被踢出", "离开"][+(obj.sub_type != "kick_me")]} 群聊: ${group.group_name} (${group.group_id})`);
            } else if (obj.sub_type == "leave") {
                if (member.role == "owner") {
                    (group.getAdmins(false) as Map<number, GroupMemberInfo>).delete(member.user_id);
                }
                (group.getMembers(false) as Map<number, GroupMemberInfo>).delete(member.user_id);
                this.conf["NoticeLog"] && this.logger.info(`[${group.group_name} (${group.group_id})] 成员 ${member.card || member.nickname} (${member.user_id}) 退出群聊`);
            }
            break;
        }
        case "group_increase": {
            let val = await this.getGroupInfo(obj.group_id, false);
            let data = val.data;
            if (!data) {
                this.logger.error(`无法获取群聊 < ${obj.group_id}> 基础信息`);
                return;
            }
            let baseGroupInfo = new GroupBaseInfo(data);
            let strangeInfo = await this.getStrangerInfoEx(obj.user_id);
            let op = await this.getStrangerInfoEx(obj.operator_id);
            if (obj.user_id == this.LoginInfo.user_id) {
                this.conf["NoticeLog"] && this.logger.info(`登录号加入群聊: ${baseGroupInfo.group_name} (${baseGroupInfo.group_id}) !`);
                let group = new GroupInfo({ "group_name": baseGroupInfo.group_name, "group_id": baseGroupInfo.group_id });
                await group._init(this);
                this.Groups.set(baseGroupInfo.group_id, group);
            } else {
                let group = await SafeGetGroupInfo.call(this, obj.group_id);
                let member = (await group.refreshMemberInfo(this, obj.user_id))!;
                this.conf["NoticeLog"] && this.logger.info(`[${group.group_name} (${group.group_id})]加入新成员: ${strangeInfo?.nickname} (${member.user_id})`);
            }
            this.events.onGroupJoin.fire(
                "OneBotDockingProcess_Event_GroupJoin",
                obj.time * 1000,
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
                    obj.time * 1000,
                    group,
                    (obj.sub_type == "lift_ban"),
                    op
                );
            } else {
                let member = (await group.refreshMemberInfo(this, obj.user_id))!;
                this.events.onGroupMute.fire(
                    "OneBotDockingProcess_Event_GroupMute",
                    obj.time * 1000,
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
                obj.time * 1000,
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
                obj.time * 1000,
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
                obj.time * 1000,
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
                            obj.time * 1000,
                            group,
                            sender,
                            target
                        );
                    } else {
                        await this.RefreshAllFriendInfo();
                        let sender = this.getFriendInfoSync(obj.user_id)!;
                        this.events.onFriendPoke.fire(
                            "OneBotDockingProcess_Event_FriendPoke",
                            obj.time * 1000,
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
                        obj.time * 1000,
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
                        obj.time * 1000,
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
                obj.time * 1000,
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
                obj.time * 1000,
                stranger,
                file
            );
            break;
        }
        case "client_status": {
            let device = new DeviceInfo(obj.client);
            this.events.onClientStatusChanged.fire(
                "OneBotDockingProcess_Event_ClientStatusChanged",
                obj.time * 1000,
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
                obj.time * 1000,
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
                obj.time * 1000,
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
                obj.time * 1000,
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

async function ProcessOneBotMetaEvent(this: OneBotDocking, obj: obj) {
    // console.log(obj);
    switch (obj.meta_event_type as "lifecycle" | "heartbeat") {
        case "lifecycle": {
            this.events.onLifecycle.fire(
                "OneBotDockingProcess_Event_Lifecycle",
                obj.time * 1000,
                obj.sub_type
            );
            break;
        }
        case "heartbeat": {
            this.events.onHeartBeat.fire(
                "OneBotDockingProcess_Event_HeartBeat",
                obj.time * 1000,
                obj.interval
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
    /**是否正在关闭*/
    public _isClosing: boolean = false;
    private _Friends = new Map<number, FriendInfo>();
    private _Groups = new Map<number, GroupInfo>();
    private _IsInitd = false;//是否成功初始化

    private DelayLogger = { "error": (...msg: any[]) => { this.logger.error(...msg); } };

    // public ShareData = new ShareData();

    private _events = {
        "onRawMessage": new Event<(rawInfo: string, ori: (isExecute: boolean, raw: string) => void) => void>(this.DelayLogger),
        /**
         * 初始化数据成功
         * @note 此监听可能会重复触发,因为重新连接也会初始化一次数据
         */
        "onInitSuccess": new Event<() => void>(this.DelayLogger),
        "onClientDisconnect": new Event<() => void>(this.DelayLogger),
        "onClientDestroy": new Event<() => void>(this.DelayLogger),
        "onClientStatusChanged": new Event<(device: DeviceInfo, online: boolean) => void>(this.DelayLogger),
        "onPrivateMsg": new Event<(senderInfo: SenderInfo, sub_type: "friend" | "group" | "discuss" | "other", msgInfo: MsgInfo) => void>(this.DelayLogger),
        "onGroupMsg": new Event<(groupInfo: GroupInfo, sub_type: "normal" | "anonymous" | "notice", groupMemberInfo: GroupMemberInfo | AnonymousInfo, msgInfo: MsgInfo) => void>(this.DelayLogger),
        // "onDiscussMsg": new Event<(discussInfo: DiscussInfo, senderInfo: SenderInfo, msgInfo: MsgInfo) => void>(),
        "onGroupUploadFile": new Event<(groupInfo: GroupInfo, groupMemberInfo: GroupMemberInfo, fileInfo: FileInfo) => void>(this.DelayLogger),
        "onGroupAdminChange": new Event<(groupInfo: GroupInfo, memberInfo: GroupMemberInfo, sub_type: "set" | "unset") => void>(this.DelayLogger),
        /**
         * @note leave//主动离开,kick//被踢,//kick_me//登录号被踢
         */
        "onGroupLeave": new Event<(groupInfo: GroupInfo, sub_type: "leave" | "kick" | "kick_me", memberInfo: GroupMemberInfo, operator: StrangerInfo | undefined) => void>(this.DelayLogger),
        "onGroupJoin": new Event<(groupInfo: GroupBaseInfo, isInvite: boolean, strangerInfo: StrangerInfo, operator: StrangerInfo | undefined) => void>(this.DelayLogger),
        "onGroupWholeMute": new Event<(group: GroupInfo, isUnMute: boolean, operator: GroupMemberInfo) => void>(this.DelayLogger),
        "onGroupMute": new Event<(groupInfo: GroupInfo, isUnMute: boolean, memberInfo: GroupMemberInfo, operator: GroupMemberInfo) => void>(this.DelayLogger),
        "onGroupRecall": new Event<(groupInfo: GroupInfo, memberInfo: GroupMemberInfo, operator: GroupMemberInfo, msg: MsgInfo) => void>(this.DelayLogger),
        "onFriendAdd": new Event<(strangerInfo: StrangerInfo) => void>(this.DelayLogger),
        "onFriendRecall": new Event<(friendInfo: FriendInfo, msg: MsgInfo) => void>(this.DelayLogger),
        "onFriendRequestAdd": new Event<(strangerInfo: StrangerInfo, comment: string, flag: string) => void>(this.DelayLogger),
        "onGroupRequestJoin": new Event<(groupInfo: GroupBaseInfo, isInviteSelf: boolean, strangerInfo: StrangerInfo, comment: string, flag: string) => void>(this.DelayLogger),
        "onGroupPoke": new Event<(group: GroupInfo, sender: GroupMemberInfo, target: GroupMemberInfo) => void>(this.DelayLogger),
        "onFriendPoke": new Event<(sender: FriendInfo) => void>(this.DelayLogger),
        "onGroupRedPacketLuckKing": new Event<(group: GroupInfo, sender: GroupMemberInfo, target: GroupMemberInfo) => void>(this.DelayLogger),
        "onGroupHonorChanged": new Event<(group: GroupInfo, honor: HonorType, member: GroupMemberInfo) => void>(this.DelayLogger),
        "onGroupCardChanged": new Event<(group: GroupInfo, member: GroupMemberInfo, card: string) => void>(this.DelayLogger),
        "onReceiveOfflineFile": new Event<(stranger: StrangerInfo, offlineFile: OfflineFileInfo) => void>(this.DelayLogger),
        "onGroupEssenceMsgChanged": new Event<(group: GroupInfo, sub_type: "add" | "delete", sender: GroupMemberInfo, operator: GroupMemberInfo, msg: MsgInfo) => void>(this.DelayLogger),
        /**
         * 心跳包触发
         * @note interval是心跳包触发时间
         */
        "onHeartBeat": new Event<(interval: number) => void>(this.DelayLogger),
        /**
         * 生命周期
         * @note 首次建立连接插件会错过connect生命周期,建议使用onInitSuccess代替connect生命周期
        */
        "onLifecycle": new Event<(type: "enable" | "disable" | "connect") => void>(this.DelayLogger)
    }

    public logger: Logger;
    constructor(
        public Name: string,
        private wsc: WebsocketClient,
        public conf: { [key: string]: any }
    ) {
        this._Init();
        this.logger = new Logger(Name, (Version.isDebug ? 5 : 4));
        if (!!(conf["LogFile"] || "").trim()) {
            this.logger.setFile(path.join("./logs", conf["LogFile"]));
        }
    }

    /**
     * 是否初始化完成
     */
    get isInitd() { return this._IsInitd; }
    /**
     * WS对象是否已被销毁
     */
    get WsIsDestroyed() { return this.wsc.isDestroy; }
    /** 
     * 客户端是否正在关闭
     */
    get isClosing() { return this._isClosing; }

    get Client() { return this.wsc; }
    get events() { return this._events; }
    get LoginInfo() { return this._LoginInfo; }
    get Groups() { return this._Groups; }
    get Friends() { return this._Friends; }

    SafeClose(code: number = 1000) {
        this._isClosing = true;
        let closeTime = Date.now();
        let close = () => {
            this.wsc.destroy(code);
            clearInterval(sid);
        };
        let sid = setInterval(() => {
            if (Object.keys(this._RequestCallbacks).length == 0) {
                close();
            } else if ((Date.now() - closeTime) >= 1000 * 10) {
                this.logger.warn("等待服务端返回超时!");
                close();
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
                this._events.onInitSuccess.fire("OneBotDockingProcess_Event_InitSuccess", null);
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
                "OneBotDockingProcess_Event_RawMessage", null,
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
                    } catch (e) { this.logger.error(`Error in RequestCallback: ${(e as Error).stack} `); }
                }
                return;
            }
            if (this._isClosing) { return; }
            // console.log(obj)
            switch (obj.post_type as "message" | "notice" | "request" | "meta_event") {
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
                case "meta_event": {
                    ProcessOneBotMetaEvent.call(this, obj);
                    break;
                }
            }
        });
        this.wsc.events.onClose.on((code, desc) => {
            // this.logger.warn(`WS已断开!退出码: ${ code }, DESC:${ desc } `);

            // this._events.onClientClose.fire(
            //     "OneBotDockingProcess_Event_ClientClose"
            // );
        });
        this.wsc.events.onDestroy.on(() => {
            this._events.onClientDestroy.fire(
                "OneBotDockingProcess_Event_ClientClose", null
            );
        });
        this.events.onRawMessage.on((raw, ori) => {
            return ori(true, raw);
        });
    }
    _SendRequest(type: string, params: { [key: string]: any }, func: (obj: { "status": status, "retcode": retcode, "data": null | any }) => void) {
        if (this._isClosing) { return; }
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
        this.logger.info(`登陆号信息获取完成: ${data.nickname} (${data.user_id})`);
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
                this.logger.info(`加载好友: ${val.remark || val.nickname} (${val.user_id})`);
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
        let Type: "private" | "group";
        if (typeof (type) == "number") {
            Type = ["private", "group"][type] as "private" | "group";
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
     * --------------------------------------------------
     * |            InvitedRequest                      |
     * |------------------------------------------------|
     * |     字段     |    类型    |    说明             |
     * |------------------------------------------------|
     * |  request_id  |   int64   |   请求ID            |
     * |  invitor_uin |   int64   |   邀请者            |
     * |  invitor_nick|   string  |   邀请者昵称         |
     * |   group_id   |   int64   |    群号             |
     * |  group_name  |   string  |    群名             |
     * |    checked   |   bool    | 是否已被处理        |
     * |     actor    |   int64   | 处理者, 未处理为0   |
     * ------------------------------------------------
     * 
     * --------------------------------------------------
     * |                JoinRequest                     |
     * | -----------------------------------------------|
     * |    字段        |  类型     |       说明         |
     * |------------------------------------------------|
     * | request_id     | int64     | 请求ID            |
     * | requester_uin  | int64     | 请求者ID          |
     * | requester_nick | string    | 请求者昵称        |
     * | message        | string    | 验证消息          |
     * | group_id       | int64     | 群号              |
     * | group_name     | string    | 群名              |
     * | checked        | bool      | 是否已被处理      |
     * | actor          | int64     | 处理者, 未处理为0 |
     * -------------------------------------------------
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
     * (自行使用new套入对接对象)
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
     * sender_id: int64	发送者QQ 号
     * sender_nick: string	发送者昵称
     * sender_time: int64	消息发送时间
     * operator_id: int64	操作者QQ 号
     * operator_nick: string	操作者昵称
     * operator_time: int64	精华设置时间
     * message_id: int32	消息ID
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
     *     "level": number//安全等级, 1: 安全 2: 未知 3: 危险
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

    //#region 频道API
    /**
     * 获取频道系统内BOT的资料
     */
    async getGuildServiceProfile() {
        return (await this._SendReqPro("get_guild_service_profile", {})) as {
            "status": status, "retcode": number, "data": { "nickname": string, "tiny_id": string, "avatar_url": string }
        };
    }

    async getGuildList() {
        return (await this._SendReqPro("get_guild_list", {})) as {
            "status": status, "retcode": number, "data": {}
        }
    }


    //#endregion
}





export {
    AnonymousInfo,
    DeviceInfo,
    FileInfo,
    FriendInfo,
    GroupBaseInfo,
    GroupInfo,
    GroupMemberInfo,
    HonorType,
    MsgInfo,
    OfflineFileInfo,
    SenderInfo,
    StrangerInfo
};