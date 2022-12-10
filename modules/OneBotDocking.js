"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneBotDocking = exports.HonorType = exports.GroupFileSystemInfo = exports.FolderInfo = exports.ForwardMsg = exports.DeviceInfo = exports.OfflineFileInfo = exports.FileInfoPro = exports.FileInfo = exports.MsgInfo = exports.AnonymousInfo = exports.StrangerInfo = exports.GroupMemberInfo = exports.GroupInfo = exports.GroupBaseInfo = exports.SenderInfo = exports.UnidirectionalFriendInfo = exports.FriendInfo = void 0;
const path_1 = __importDefault(require("path"));
const logger_1 = require("../tools/logger");
const WebSocket_1 = require("./WebSocket");
class FriendInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    set nickname(a) { this.obj.nickname = a; }
    get remark() { return this.obj.remark; }
    set remark(a) { this.obj.remark = a; }
}
exports.FriendInfo = FriendInfo;
class UnidirectionalFriendInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    get source() { return this.obj.source; }
}
exports.UnidirectionalFriendInfo = UnidirectionalFriendInfo;
class SenderInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get user_id() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    set nickname(a) { this.obj.nickname = a; }
    //不准,极为可能为unknown
    get sex() { return this.obj.sex; }
    //不准
    get age() { return this.obj.age; }
}
exports.SenderInfo = SenderInfo;
/**
 * 请勿长期保存
 */
class GroupBaseInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get group_id() {
        return this.obj.group_id;
    }
    get group_name() { return this.obj.group_name; }
    get member_count() { return this.obj.member_count; }
    get max_member_count() { return this.obj.max_member_count; }
}
exports.GroupBaseInfo = GroupBaseInfo;
class GroupInfo {
    constructor(obj) {
        this.obj = obj;
        this._Admins = new Map();
        this._Members = new Map();
    }
    _init(_this) {
        return __awaiter(this, void 0, void 0, function* () {
            _this.logger.info(`正在初始化群信息: ${this.obj.group_name}(${this.obj.group_id})...`);
            let val = yield _this.getGroupMemberList(this.obj.group_id);
            let data = val.data;
            if (data == null) {
                _this.logger.info(`初始化群信息: ${this.obj.group_name}(${this.obj.group_id}) 失败!`);
                return;
            }
            data.forEach((val) => {
                let memberInfo = new GroupMemberInfo(val);
                if (memberInfo.role == "owner") {
                    this._Owner = memberInfo;
                }
                else if (memberInfo.role == "admin") {
                    this._Admins.set(memberInfo.user_id, memberInfo);
                }
                this._Members.set(memberInfo.user_id, memberInfo);
                // logger.info(`- 群成员: ${memberInfo.card || memberInfo.nickname}(${memberInfo.user_id}) 已记录!`);
            });
            let ow = this._Owner;
            _this.logger.info(`初始化群成员信息: ${this.obj.group_name}(${this.obj.group_id}) 成功!群主: ${ow.card || ow.nickname}(${ow.user_id}),共计 ${this._Members.size} 个群成员, ${this._Admins.size} 个管理员`);
            // logger.info(JSON.stringify(data, null, 2));
        });
    }
    getBaseData(_this) {
        return __awaiter(this, void 0, void 0, function* () {
            let val = yield _this.getGroupInfo(this.obj.group_id, false);
            let data = val.data;
            if (data == null) {
                _this.logger.error(`获取群聊: ${this.obj.group_id} 基础信息失败!`);
                return;
            }
            return new GroupBaseInfo(data);
        });
    }
    refreshMemberInfo(_this, user_id) {
        return __awaiter(this, void 0, void 0, function* () {
            let mem = this._Members.get(user_id);
            let val = yield _this.getGroupMemberInfoEx(+this.obj.group_id, +user_id, true);
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
        });
    }
    get Owner() { return this._Owner; }
    getAdmins(useArr) {
        if (useArr) {
            let obj = {};
            let iters = this._Admins.entries(), iter = iters.next();
            while (!iter.done) {
                let v = iter.value;
                obj[v[0]] = v[1];
                iter = iters.next();
            }
            return obj;
        }
        else {
            return this._Admins;
        }
    }
    getMembers(useArr) {
        if (useArr) {
            let obj = {};
            let iters = this._Members.entries(), iter = iters.next();
            while (!iter.done) {
                let v = iter.value;
                obj[v[0]] = v[1];
                iter = iters.next();
            }
            return obj;
        }
        else {
            return this._Members;
        }
    }
    get group_name() { return this.obj.group_name; }
    set group_name(a) { this.obj.group_name = a; }
    get group_id() { return this.obj.group_id; }
    set group_id(a) { this.obj.group_id = a; }
    senderGetMember(sender) {
        return this._Members.get(sender.user_id);
    }
    strangerGetMember(stranger) {
        return this._Members.get(stranger.user_id);
    }
    getMember(user_id) {
        return this._Members.get(user_id);
    }
}
exports.GroupInfo = GroupInfo;
class GroupMemberInfo {
    constructor(obj) {
        this.obj = obj;
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
}
exports.GroupMemberInfo = GroupMemberInfo;
class StrangerInfo {
    constructor(obj) {
        this.obj = obj;
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
exports.StrangerInfo = StrangerInfo;
class AnonymousInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get id() { return this.obj.id; }
    get name() { return this.obj.name; }
    get flag() { return this.obj.flag; }
    get isValid() { return this.obj == null; }
}
exports.AnonymousInfo = AnonymousInfo;
class MsgInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get msg() { return this.obj.message; }
    get raw() { return this.obj.raw_message; }
    get msg_id() { return this.obj.message_id; }
}
exports.MsgInfo = MsgInfo;
class FileInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get id() { return this.obj.id; }
    get name() { return this.obj.name; }
    get size() { return this.obj.size; }
    get busid() { return this.obj.busid; }
}
exports.FileInfo = FileInfo;
class FileInfoPro {
    constructor(obj) {
        this.obj = obj;
    }
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
exports.FileInfoPro = FileInfoPro;
class OfflineFileInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get name() { return this.obj.name; }
    get size() { return this.obj.size; }
    get url() { return this.obj.url; }
}
exports.OfflineFileInfo = OfflineFileInfo;
class DeviceInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get app_id() { return this.obj.app_id; }
    get device_name() { return this.obj.device_name; }
    /** 设备类型 */
    get device_kind() { return this.obj.device_kind; }
}
exports.DeviceInfo = DeviceInfo;
class ForwardMsg {
    constructor(obj) {
        this.obj = obj;
    }
    get content() { return this.obj.content; }
    get sender() { return this.obj.sender; }
    get time() { return this.obj.time; }
}
exports.ForwardMsg = ForwardMsg;
class FolderInfo {
    constructor(obj) {
        this.obj = obj;
    }
    get group_id() { return this.obj.group_id; }
    get folder_id() { return this.obj.folder_id; }
    get folder_name() { return this.obj.folder_name; }
    get create_time() { return this.obj.create_time; }
    get creator() { return this.obj.creator; }
    get creator_name() { return this.obj.creator_name; }
    get total_file_count() { return this.obj.total_file_count; }
}
exports.FolderInfo = FolderInfo;
class GroupFileSystemInfo {
    constructor(obj) {
        this.obj = obj;
    }
    //文件总数
    get file_count() { return this.obj.file_count; }
    //文件上限
    get limit_count() { return this.obj.limit_count; }
    //已使用空间
    get used_space() { return this.obj.used_space; }
    //空间上限
    get total_space() { return this.obj.total_space; }
}
exports.GroupFileSystemInfo = GroupFileSystemInfo;
var HonorType;
(function (HonorType) {
    HonorType["\u9F99\u738B"] = "talkative";
    HonorType["\u7FA4\u804A\u4E4B\u706B"] = "performer";
    HonorType["\u5FEB\u4E50\u6E90\u6CC9"] = "emotion";
})(HonorType = exports.HonorType || (exports.HonorType = {}));
function SafeGetGroupInfo(group_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let group = this.getGroupInfoSync(group_id);
        if (group == null) {
            group = new GroupInfo({
                "group_id": group_id,
                "group_name": (yield this.getGroupBaseInfoEx(group_id)).group_name
            });
            yield group._init(this);
            this.Groups.set(group.group_id, group);
        }
        return group;
    });
}
function ProcessOneBotMessage(obj) {
    return __awaiter(this, void 0, void 0, function* () {
        let sender = new SenderInfo(obj.sender);
        // console.log(obj.sender);
        switch (obj.message_type) {
            case "private": {
                let msg = new MsgInfo({ "message": obj.message, "message_id": obj.message_id, "raw_message": obj.raw_message });
                // this.MsgIDMap.set(msg.msg_id, msg);
                this.events.onPrivateMsg.fire("OneBotDockingProcess_Event_PrivateMsg", sender, obj.sub_type, msg);
                this.conf["MsgLog"] && this.logger.info(`私聊消息: ${sender.nickname} >> ${msg.msg}`);
                break;
            }
            case "group": {
                let msg = new MsgInfo({ "message": obj.message, "message_id": obj.message_id, "raw_message": obj.raw_message });
                // this.MsgIDMap.set(msg.msg_id, msg);
                let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                let member;
                // console.log(obj);
                if (obj.sub_type == "anonymous") {
                    member = new AnonymousInfo(obj.anonymous);
                }
                else {
                    member = (yield group.refreshMemberInfo(this, sender.user_id));
                    // member = group.senderGetMember(sender)!;
                }
                this.events.onGroupMsg.fire("OneBotDockingProcess_Event_GroupMsg", group, obj.sub_type, member, msg);
                this.conf["MsgLog"] && this.logger.info(`[${group.group_name}(${group.group_id})] ${sender.nickname} >> ${msg.msg}`);
                break;
            }
            // case "discuss": {
            //     break;
            // }
        }
    });
}
function ProcessOneBotNotice(obj) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(obj);
        switch (obj.notice_type) {
            case "group_upload": {
                let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                let member = group.getMember(obj.user_id);
                let file = new FileInfo(obj.file);
                this.events.onGroupUploadFile.fire("OneBotDockingProcess_Event_GroupUploadFile", group, member, file);
                break;
            }
            case "group_admin": {
                let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                let member = group.getMember(obj.user_id);
                this.events.onGroupAdminChange.fire("OneBotDockingProcess_Event_GroupAdminChange", group, member, obj.sub_type);
                let perms = ["Admin", "Member"];
                yield group.refreshMemberInfo(this, member.user_id);
                this.conf["NoticeLog"] && this.logger.info(`[${group.group_name}(${group.group_id})] 群管理员变动: ${member.card || member.nickname}(${member.user_id}) (${perms[+(obj.sub_type == "set")]})->(${perms[+(obj.sub_type == "unset")]})`);
                break;
            }
            case "group_decrease": {
                let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                let member = group.getMember(obj.user_id);
                let op = yield this.getStrangerInfoEx(obj.operator_id);
                this.events.onGroupLeave.fire("OneBotDockingProcess_Event_GroupLeave", group, obj.sub_type, member, op);
                if (group.Owner.user_id == obj.user_id) {
                    this.Groups.delete(obj.group_id);
                    this.conf["NoticeLog"] && this.logger.info(`群聊: [${group.group_name}](${group.group_id}) 已解散`);
                }
                else if (obj.user_id == this.LoginInfo.user_id) {
                    this.Groups.delete(group.group_id);
                    this.conf["NoticeLog"] && this.logger.info(`登录号${["被踢出", "离开"][+(obj.sub_type != "kick_me")]}群聊: ${group.group_name}(${group.group_id})`);
                }
                else if (obj.sub_type == "leave") {
                    if (member.role == "owner") {
                        group.getAdmins(false).delete(member.user_id);
                    }
                    group.getMembers(false).delete(member.user_id);
                    this.conf["NoticeLog"] && this.logger.info(`[${group.group_name}(${group.group_id})] 成员 ${member.card || member.nickname}(${member.user_id}) 退出群聊`);
                }
                break;
            }
            case "group_increase": {
                let val = yield this.getGroupInfo(obj.group_id, false);
                let data = val.data;
                if (!data) {
                    this.logger.error(`无法获取群聊 <${obj.group_id}> 基础信息`);
                    return;
                }
                let baseGroupInfo = new GroupBaseInfo(data);
                let strangeInfo = yield this.getStrangerInfoEx(obj.user_id);
                let op = yield this.getStrangerInfoEx(obj.operator_id);
                if (obj.user_id == this.LoginInfo.user_id) {
                    this.conf["NoticeLog"] && this.logger.info(`登录号加入群聊: ${baseGroupInfo.group_name}(${baseGroupInfo.group_id})!`);
                    let group = new GroupInfo({ "group_name": baseGroupInfo.group_name, "group_id": baseGroupInfo.group_id });
                    yield group._init(this);
                    this.Groups.set(baseGroupInfo.group_id, group);
                }
                else {
                    let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                    let member = (yield group.refreshMemberInfo(this, obj.user_id));
                    this.conf["NoticeLog"] && this.logger.info(`[${group.group_name}(${group.group_id})] 加入新成员: ${strangeInfo === null || strangeInfo === void 0 ? void 0 : strangeInfo.nickname}(${member.user_id})`);
                }
                this.events.onGroupJoin.fire("OneBotDockingProcess_Event_GroupJoin", baseGroupInfo, (obj.sub_type == "invite"), strangeInfo, op);
                break;
            }
            case "group_ban": {
                let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                let op = (yield group.refreshMemberInfo(this, obj.operator_id));
                if (obj.user_id == 0) {
                    this.events.onGroupWholeMute.fire("OneBotDockingProcess_Event_GroupWholeMute", group, (obj.sub_type == "lift_ban"), op);
                }
                else {
                    let member = (yield group.refreshMemberInfo(this, obj.user_id));
                    this.events.onGroupMute.fire("OneBotDockingProcess_Event_GroupMute", group, (obj.sub_type == "lift_ban"), member, op);
                }
                break;
            }
            case "group_recall": {
                let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                let member = group.getMember(obj.user_id);
                let op = group.getMember(obj.operator_id);
                let msg = yield this.getMsgInfoEx(obj.message_id);
                // let msg = this.MsgIDMap.get(obj.message_id);
                if (!msg) {
                    return;
                }
                this.events.onGroupRecall.fire("OneBotDockingProcess_Event_GroupRecall", group, member, op, msg);
                break;
            }
            case "friend_add": {
                let strangerInfo = (yield this.getStrangerInfoEx(obj.user_id));
                yield this.RefreshAllFriendInfo();
                this.events.onFriendAdd.fire("OneBotDockingProcess_Event_FriendAdd", strangerInfo);
                break;
            }
            case "friend_recall": {
                yield this.RefreshAllFriendInfo();
                let friendInfo = this.getFriendInfoSync(obj.user_id);
                let msg = yield this.getMsgInfoEx(obj.message_id);
                // let msg = this.MsgIDMap.get(obj.message_id);
                if (!msg) {
                    return;
                }
                this.events.onFriendRecall.fire("OneBotDockingProcess_Event_FriendRecall", friendInfo, msg);
                // let friend = 
                break;
            }
            case "notify": {
                let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                switch (obj.sub_type) {
                    case "poke": {
                        if (group) {
                            let sender = (yield group.refreshMemberInfo(this, obj.user_id));
                            let target = (yield group.refreshMemberInfo(this, obj.target_id));
                            this.events.onGroupPoke.fire("OneBotDockingProcess_Event_GroupPoke", group, sender, target);
                        }
                        else {
                            yield this.RefreshAllFriendInfo();
                            let sender = this.getFriendInfoSync(obj.user_id);
                            this.events.onFriendPoke.fire("OneBotDockingProcess_Event_FriendPoke", sender);
                        }
                        break;
                    }
                    case "lucky_king": {
                        let member = (yield group.refreshMemberInfo(this, obj.user_id));
                        let target = (yield group.refreshMemberInfo(this, obj.target_id));
                        this.events.onGroupRedPacketLuckKing.fire("OneBotDockingProcess_Event_GroupRedPacketLuckKing", group, member, target);
                        break;
                    }
                    case "honor": {
                        let member = (yield group.refreshMemberInfo(this, obj.user_id));
                        this.events.onGroupHonorChanged.fire("OneBotDockingProcess_Event_GroupHonorChanged", group, obj.honor_type, member);
                        break;
                    }
                }
                break;
            }
            case "group_card": {
                let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                let member = group.getMember(obj.user_id);
                this.events.onGroupCardChanged.fire("OneBotDockingProcess_Event_GroupCardChanged", group, member, obj.card_new);
                member.card = obj.card_new;
                break;
            }
            case "offline_file": {
                let stranger = (yield this.getStrangerInfoEx(obj.user_id));
                let file = new OfflineFileInfo(obj.file);
                this.events.onReceiveOfflineFile.fire("OneBotDockingProcess_Event_ReceiveOfflineFile", stranger, file);
                break;
            }
            case "client_status": {
                let device = new DeviceInfo(obj.client);
                this.events.onClientStatusChanged.fire("OneBotDockingProcess_Event_ClientStatusChanged", device, obj.online);
                break;
            }
            case "essence": {
                let group = yield SafeGetGroupInfo.call(this, obj.group_id);
                if (!group) {
                    return;
                }
                let msg = yield this.getMsgInfoEx(obj.message_id);
                // let msg = this.MsgIDMap.get(obj.message_id);
                if (!msg) {
                    return;
                }
                let sender = (yield group.refreshMemberInfo(this, obj.sender_id));
                let op = (yield group.refreshMemberInfo(this, obj.operator_id));
                this.events.onGroupEssenceMsgChanged.fire("OneBotDockingProcess_Event_GroupEssenceMsgChanged", group, obj.sub_type, sender, op, msg);
                break;
            }
        }
    });
}
function ProcessOneBotRequest(obj) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(obj);
        switch (obj.request_type) {
            case "friend": {
                let strangerInfo = (yield this.getStrangerInfoEx(obj.user_id));
                this.events.onFriendRequestAdd.fire("OneBotDockingProcess_Event_FriendRequestAdd", strangerInfo, obj.comment, obj.flag);
                break;
            }
            case "group": {
                let groupBaseInfo = (yield this.getGroupBaseInfoEx(obj.group_id));
                let strangerInfo = (yield this.getStrangerInfoEx(obj.user_id));
                this.events.onGroupRequestJoin.fire("OneBotDockingProcess_Event_GroupRequestJoin", groupBaseInfo, (obj.sub_type == "invite"), strangerInfo, obj.comment, obj.flag);
                break;
            }
        }
    });
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
class OneBotDocking {
    constructor(Name, wsc, conf) {
        this.Name = Name;
        this.wsc = wsc;
        this.conf = conf;
        this._LoginInfo = { "user_id": -1, "nickname": "Unknown" };
        // public MsgIDMap = new Map<number, MsgInfo>();
        this._RequestCallbacks = {};
        this.isClosing = false;
        this._Friends = new Map();
        this._Groups = new Map();
        this._IsInitd = false; //是否成功初始化
        // public ShareData = new ShareData();
        this._events = {
            "onRawMessage": new WebSocket_1.Event(),
            "onInitSuccess": new WebSocket_1.Event(),
            "onClientClose": new WebSocket_1.Event(),
            "onClientStatusChanged": new WebSocket_1.Event(),
            "onPrivateMsg": new WebSocket_1.Event(),
            "onGroupMsg": new WebSocket_1.Event(),
            // "onDiscussMsg": new Event<(discussInfo: DiscussInfo, senderInfo: SenderInfo, msgInfo: MsgInfo) => void>(),
            "onGroupUploadFile": new WebSocket_1.Event(),
            "onGroupAdminChange": new WebSocket_1.Event(),
            /**
             * @note leave//主动离开,kick//被踢,//kick_me//登录号被踢
             */
            "onGroupLeave": new WebSocket_1.Event(),
            "onGroupJoin": new WebSocket_1.Event(),
            "onGroupWholeMute": new WebSocket_1.Event(),
            "onGroupMute": new WebSocket_1.Event(),
            "onGroupRecall": new WebSocket_1.Event(),
            "onFriendAdd": new WebSocket_1.Event(),
            "onFriendRecall": new WebSocket_1.Event(),
            "onFriendRequestAdd": new WebSocket_1.Event(),
            "onGroupRequestJoin": new WebSocket_1.Event(),
            "onGroupPoke": new WebSocket_1.Event(),
            "onFriendPoke": new WebSocket_1.Event(),
            "onGroupRedPacketLuckKing": new WebSocket_1.Event(),
            "onGroupHonorChanged": new WebSocket_1.Event(),
            "onGroupCardChanged": new WebSocket_1.Event(),
            "onReceiveOfflineFile": new WebSocket_1.Event(),
            "onGroupEssenceMsgChanged": new WebSocket_1.Event()
        };
        this._Init();
        this.logger = new logger_1.Logger(Name, 4);
        if (!!(conf["LogFile"] || "").trim()) {
            this.logger.setFile(path_1.default.join("./logs", conf["LogFile"]));
        }
    }
    get Client() { return this.wsc; }
    get events() { return this._events; }
    get LoginInfo() { return this._LoginInfo; }
    get Groups() { return this._Groups; }
    get Friends() { return this._Friends; }
    SafeClose(code = 1000) {
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
        this.wsc.events.onStart.on(() => __awaiter(this, void 0, void 0, function* () {
            // this.sendMsg("group", 1073980007, "复读机已启动");
            // this._SendReqPro("get_group_member_list", {
            //     "group_id": 1073980007
            // }).then((val) => {
            //     console.log(val);
            // });
            if ((yield this._loadLoginInfo()) &&
                (yield this._loadFriends()) &&
                (yield this._loadGroupsInfo())) {
                this._events.onInitSuccess.fire("OneBotDockingProcess_Event_InitSuccess");
                this.logger.info(`基础信息初始化成功!`);
                this._IsInitd = true;
            }
            else {
                this.logger.fatal(`基础信息初始化失败!`);
            }
        }));
        this.wsc.events.onMsg.on((msg, isBuff) => {
            if (isBuff) {
                this.logger.warn("暂不支持Buffer信息!");
                return;
            }
            let msg_ = msg, b = true;
            this.events.onRawMessage.fire("OneBotDockingProcess_Event_RawMessage", msg_, (boo, msg) => {
                b = (b ? boo : b);
                if (boo) {
                    msg_ = msg;
                }
            });
            if (!b) {
                return;
            }
            let obj = {};
            try {
                obj = JSON.parse(msg_);
            }
            catch (e) {
                this.logger.error("无法进行解析工作! ", e.stack);
                this.logger.error("WorkMessage:", msg_);
                return;
            }
            if (obj.echo != null) {
                let echo = obj.echo;
                if (this._RequestCallbacks[echo]) {
                    try {
                        this._RequestCallbacks[echo](obj);
                        delete this._RequestCallbacks[echo];
                    }
                    catch (e) {
                        this.logger.error(`Error in RequestCallback: ${e.stack}`);
                    }
                }
                return;
            }
            if (this.isClosing) {
                return;
            }
            // console.log(obj)
            switch (obj.post_type) {
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
            this._events.onClientClose.fire("OneBotDockingProcess_Event_ClientClose");
        });
        this.events.onRawMessage.on((raw, ori) => {
            return ori(true, raw);
        });
    }
    _SendRequest(type, params, func) {
        if (this.isClosing) {
            return;
        }
        let id = Math.random().toString(16).slice(2);
        this._RequestCallbacks[id] = func;
        let content = {
            "action": type,
            "params": params,
            "echo": id
        };
        this.wsc.send(JSON.stringify(content));
    }
    _SendReqPro(type, params) {
        let pro = new Promise((outMsg, outErr) => {
            this._SendRequest(type, params, (obj) => {
                outMsg(obj);
            });
        });
        return pro;
    }
    _loadLoginInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let val = yield this.getLoginInfo();
            let data = val.data;
            if (data == null) {
                this.logger.error(`登录号信息获取失败!`);
                return false;
            }
            this._LoginInfo = {
                "user_id": data.user_id,
                "nickname": data.nickname
            };
            this.logger.info(`登陆号信息获取完成: ${data.nickname}(${data.user_id})`);
            return true;
        });
    }
    _loadFriends() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("正在加载好友列表...");
            this._Friends.clear();
            let val = yield this.getFriendList();
            let data = val.data;
            if (data == null) {
                this.logger.error("获取好友列表失败!");
                return false;
            }
            else {
                let i = 0;
                data.forEach((val) => {
                    this._Friends.set(val.user_id, new FriendInfo(val));
                    this.logger.info(`加载好友: ${val.remark || val.nickname}(${val.user_id})`);
                    i++;
                });
                this.logger.info(`加载完成!共 ${i} 个好友!`);
            }
            return true;
        });
    }
    _loadGroupsInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info("正在加载群聊信息...");
            this._Groups.clear();
            let val = yield this.getGroupList();
            let data = val.data;
            if (data == null) {
                this.logger.error(`获取群聊列表失败!`);
                return false;
            }
            for (let i = 0, l = data.length; i < l; i++) {
                let val = data[i];
                if (!this._Groups.has(val.group_id)) {
                    let groupInfo = new GroupInfo(val);
                    yield groupInfo._init(this);
                    this._Groups.set(groupInfo.group_id, groupInfo);
                }
            }
            return true;
        });
    }
    groupBaseInfoGetGroupInfo(base) {
        return this._Groups.get(base.group_id);
    }
    getGroupInfoSync(group_id) {
        return this._Groups.get(group_id);
    }
    getFriendInfoSync(user_id) {
        return this._Friends.get(user_id);
    }
    RefreshAllFriendInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = (yield this.getFriendList()).data;
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
        });
    }
    getGroupBaseInfoEx(group_id) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = (yield this.getGroupInfo(group_id, true)).data;
            if (!data) {
                return;
            }
            return new GroupBaseInfo(data);
        });
    }
    getStrangerInfoEx(user_id, no_cache = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let val = yield this.getStrangerInfo(user_id, no_cache);
            let data = val.data;
            if (data == null) {
                return;
            }
            return new StrangerInfo(data);
        });
    }
    getGroupMemberInfoEx(group_id, user_id, no_cache = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let val = yield this.getGroupMemberInfo(group_id, user_id, no_cache);
            let data = val.data;
            if (data == null) {
                return;
            }
            // console.log(data);
            return new GroupMemberInfo(data);
        });
    }
    getMsgInfoEx(msg_id) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = (yield this.getMsg(msg_id)).data;
            // console.log(data);
            if (!data) {
                return;
            }
            return new MsgInfo(data);
        });
    }
    //#region API
    // https://github.com/ishkong/go-cqhttp-docs/tree/main/docs/api
    sendMsg(type, id, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let Type;
            if (typeof (type) == "number") {
                Type = ["private", "group", "discuss"][type];
            }
            else {
                Type = type;
            }
            let json = {
                "message_type": Type,
                "message": msg
            };
            switch (Type) {
                case "private":
                    json["user_id"] = id;
                    break;
                case "group":
                    json["group_id"] = id;
                    break;
                case "discuss":
                    json["discuss_id"] = id;
                    break;
            }
            return yield this._SendReqPro("send_msg", json);
        });
    }
    ;
    deleteMsg(msg_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("delete_msg", { "message_id": msg_id });
        });
    }
    getMsg(msg_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_msg", { "message_id": msg_id });
        });
    }
    getForwardMsgs(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_forward_msg", { "message_id": id });
        });
    }
    /**
     * @param user_id
     * @param count Max 10
     * @deprecated 机器人框架未支持
     */
    sendLike(user_id, count) {
        return __awaiter(this, void 0, void 0, function* () {
            count = (count > 10 ? 10 : (count < 1 ? 1 : count));
            return yield this._SendReqPro("send_like", { "user_id": user_id, "times": count });
        });
    }
    groupKick(group_id, user_id, reject_add_request = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_kick", { "group_id": group_id, "user_id": user_id, "reject_add_request": reject_add_request });
        });
    }
    /**
     * @param group_id
     * @param user_id
     * @param duration 秒,0代表取消
     */
    groupMute(group_id, user_id, duration = 60 * 30) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_ban", { "group_id": group_id, "user_id": user_id, "duration": duration });
        });
    }
    groupMuteAnonymous(group_id, anonymous_flag, duration = 60 * 30) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._SendReqPro("set_group_anonymous_ban", { "group_id": group_id, "anonymous_flag": anonymous_flag, "duration": duration });
        });
    }
    setAllMute(group_id, isMute = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_whole_ban", { "group_id": group_id, "enable": isMute });
        });
    }
    setGroupAdmin(group_id, user_id, enable = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_admin", { "group_id": group_id, "user_id": user_id, "enable": enable });
        });
    }
    /**
     * @deprecated 机器人框架未支持
     */
    setGroupAnonymous(group_id, enable = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_anonymous", { group_id, enable });
        });
    }
    /**
     * @param group_id
     * @param user_id
     * @param card 群名片内容，不填或空字符串表示删除群名片
     */
    setGroupCard(group_id, user_id, card = "") {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_card", { group_id, user_id, card });
        });
    }
    setGroupName(group_id, group_name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_name", { group_id, group_name });
        });
    }
    /**
     * @param group_id
     * @param is_dismiss 是否解散，如果登录号是群主，则仅在此项为 true 时能够解散
     */
    leaveGroup(group_id, is_dismiss = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_leave", { group_id, is_dismiss });
        });
    }
    /**
     * @param group_id
     * @param user_id
     * @param special_title 专属头衔，不填或空字符串表示删除专属头衔
     * @param duration 专属头衔有效期，单位秒，-1 表示永久，不过此项似乎没有效果，可能是只有某些特殊的时间长度有效，有待测试
     */
    setGroupSpecialTitle(group_id, user_id, special_title = "", duration = -1) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_special_title", { group_id, user_id, special_title, duration });
        });
    }
    sendGroupSign(group_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("send_group_sign", { group_id });
        });
    }
    /**
     * @param discuss_id
     * @deprecated QQ已无群组
     */
    leaveDiscuss(discuss_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_discuss_leave ", { discuss_id });
        });
    }
    /**
     * @param flag
     * @param approve 是否同意请求
     * @param remark 添加后的好友备注（仅在同意时有效）
     * @returns
     */
    processFriendAddRequest(flag, approve = true, remark = "") {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_friend_add_request", { flag, approve, remark });
        });
    }
    /**
     * @param flag
     * @param sub_type add 或 invite，请求类型（需要和上报消息中的 sub_type 字段相符）
     * @param approve 是否同意请求／邀请
     * @param reason 拒绝理由（仅在拒绝时有效）
     * @returns
     */
    processGroupMemberAddRequest(flag, sub_type, approve = true, reason = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_add_request", { flag, sub_type, approve, reason });
        });
    }
    getLoginInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_login_info", {});
        });
    }
    /**
     * 注意 该API只有企点协议可用
     */
    getQiDianAccountInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("qidian_get_account_info", {});
        });
    }
    /**
     * @param nickname 名称
     * @param company 公司
     * @param email 邮箱
     * @param college 学校
     * @param personal_note 个人说明
     */
    setQQProfile(nickname, company, email, college, personal_note) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_qq_profile", {});
        });
    }
    getStrangerInfo(user_id, no_cache = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_stranger_info", { user_id, no_cache });
        });
    }
    getFriendList() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_friend_list", {});
        });
    }
    getUnidirectionalFriendList() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_unidirectional_friend_list", {});
        });
    }
    getGroupList() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_list", {});
        });
    }
    /**
     * @param group_id
     * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
     * @returns
     */
    getGroupInfo(group_id, no_cache = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_info", { group_id, no_cache });
        });
    }
    /**
     * @param group_id
     * @param user_id
     * @param no_cache 是否不使用缓存（使用缓存可能更新不及时，但响应更快）
     */
    getGroupMemberInfo(group_id, user_id, no_cache = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_member_info", { group_id, user_id, no_cache });
        });
    }
    getGroupMemberList(group_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_member_list", { group_id });
        });
    }
    getGroupHonorInfo(group_id, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_honor_info", { group_id, type });
        });
    }
    /**
     * @deprecated 机器人框架未支持
     */
    getCookies() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_cookies", {});
        });
    }
    /**
     * @deprecated 机器人框架未支持
     */
    getCsrfToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_csrf_token", {});
        });
    }
    /**
    * @deprecated 机器人框架未支持
    */
    getCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_credentials", {});
        });
    }
    /**
    * @deprecated 机器人框架未支持
    */
    getRecord(file, out_format, full_path = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_record", { file, out_format, full_path });
        });
    }
    getImage(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_image", { file });
        });
    }
    canSendImage() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("can_send_image", {});
        });
    }
    canSendRecord() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("can_send_record", {});
        });
    }
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_status", {});
        });
    }
    getVersionInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_version_info", {});
        });
    }
    setRestart(delay = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_restart", { delay });
        });
    }
    /**
     * @deprecated 机器人框架未支持
     */
    setRestartPlugin(delay = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_restart_plugin", { delay });
        });
    }
    /**
    * @deprecated 机器人框架未支持
    */
    cleanDataDir(data_dir) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("clean_data_dir", { data_dir });
        });
    }
    /**
    * @deprecated 机器人框架未支持
    */
    cleanCache() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("clean_cache", {});
        });
    }
    /**
    * @deprecated 机器人框架未支持
    */
    cleanPluginLog() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("clean_plugin_log", {});
        });
    }
    setGroupPortrait(group_id, file, cache = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set_group_portrait", { group_id, file, "cache": +cache });
        });
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
    getGroupSystemMsg() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_system_msg", {});
        });
    }
    /**
     * @param user_id
     * @param file 本地文件目录
     * @param name
     */
    uploadPrivateFile(user_id, file, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("upload_private_file", { user_id, file, name });
        });
    }
    /**
     * @param group_id
     * @param file
     * @param name
     * @param folder 父目录id
     */
    uploadGroupFile(group_id, file, name, folder) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("upload_group_file", { group_id, file, folder });
        });
    }
    getGroupFileSystemInfo(group_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_file_system_info", { group_id });
        });
    }
    /**
     * @note ```
     * (自行使用new套入对接对象)
     * data: null |
     * files	File[]	文件列表
     * folders	Folder[]	文件夹列表
     * ```
     */
    getGroupRootFiles(group_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_root_files", { group_id });
        });
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
    getGroupFilesByFolder(group_id, folder_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_files_by_folder", { group_id, folder_id });
        });
    }
    /**
     * @param group_id
     * @param name
     * @param parent_id 仅能为 /
     * @returns
     */
    createGroupFileFolder(group_id, name, parent_id = "/") {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("create_group_file_folder", { group_id, name, parent_id });
        });
    }
    deleteGroupFolder(group_id, folder_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("delete_group_folder", { group_id, folder_id });
        });
    }
    deleteGroupFile(group_id, file_id, busid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("delete_group_file", { group_id, file_id, busid });
        });
    }
    getGroupFileUrl(group_id, file_id, busid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_file_url", { group_id, file_id, busid });
        });
    }
    getGroupAtAllRemain(group_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_at_all_remain", { group_id });
        });
    }
    downloadFile(url, thread_count, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("download_file", { url, thread_count, headers });
        });
    }
    getOnlineClients(no_cache = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_online_clients", { no_cache });
        });
    }
    getGroupMsgHistory(group_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_group_msg_history", { group_id });
        });
    }
    setEssenceMsg(message_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("set-essence_msg", { message_id });
        });
    }
    deleteEssenceMsg(message_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("delete_essence_msg", { message_id });
        });
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
    getEssenceMsgList(group_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("get_essence_msg_list", { group_id });
        });
    }
    /**
     * @note ```
     * data: null |
     * {
     * "level": number//安全等级, 1: 安全 2: 未知 3: 危险
     * }
     * ```
     */
    checkUrlSafely(url) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("check_url_safely", { url });
        });
    }
    deleteUnidirectionalFriend(user_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._SendReqPro("delete_unidirectional_friend", { user_id });
        });
    }
}
exports.OneBotDocking = OneBotDocking;
