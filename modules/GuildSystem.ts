import { ErrorPrint } from "./RunTime/ErrorPrint";
import { OneBotDocking, TMBotPromise, obj, ret_data_struct } from "./OneBotDocking";
import { GuildChannelInfo } from "./QQChannelTypes/GuildChannelInfo";
import { GuildInfo } from "./QQChannelTypes/GuildInfo";
import { GuildMemberInfo, GuildMemberProfileInfo } from "./QQChannelTypes/GuildMemberInfo";
import { GuildMetaInfo } from "./QQChannelTypes/GuildMetaInfo";
import { GuildMsgInfo, GuildMsgInfoEx } from "./QQChannelTypes/GuildMsgInfo";
import { GuildSenderInfo } from "./QQChannelTypes/GuildSenderInfo";
import { ReactionInfos } from "./QQChannelTypes/ReactionInfo";
import { Msg_Info } from "./QQDataTypes/MsgInfo";
import { TEvent } from "./RunTime/TEvent";
import { MessageDB } from "./RunTime/MessageDB";
import { FeedInfo } from "./QQChannelTypes/FeedInfo";
import { GuildRole } from "./QQChannelTypes/GuildRole";


export type GuildMemberListIters = {
    "finished": boolean,
    "next": undefined | GuildMemberList_Next,
    "token": undefined | string,
    "members": GuildMemberInfo[]
};
type GuildMemberList_Next = () => Promise<GuildMemberListIters | undefined>;

function SafeGetGuild(this: GuildSystem, guild_id: string) {
    return new Promise<GuildInfo>(async (ret) => {
        let GuildList = (function (this: GuildSystem) { return this._Guilds; }).call(this);
        if (GuildList.has(guild_id)) {
            return ret(GuildList.get(guild_id)!);
        }
        let guilds = await this.getGuildListEx();
        let i = 0, l = guilds.length;
        while (i < l) {
            let guild = guilds[i];
            if (guild.guild_id == guild_id) {
                await guild._init(this);
                GuildList.set(guild_id, guild);
                return ret(guild);
            }
            i++;
        }
        this.log.error(`获取频道信息: {${guild_id}} 失败!`);
    });
}

function SafeGetChannel(this: GuildSystem, guild: GuildInfo, channel_id: string) {
    return new Promise<GuildChannelInfo>(async (ret) => {
        let res = guild.getChannel(channel_id);
        if (!res) {
            let cls = await this.getGuildChannelListEx(guild.guild_id, true);
            if (!!cls) {
                let l = cls.length, i = 0;
                while (i < l) {
                    let cl = cls[i];
                    if (cl.channel_id == channel_id) {
                        guild._updateChannelInfo("add", cl);
                        return cl;
                    }
                    i++;
                }
            }
        }
        if (!!res) { return ret(res); }
        this.log.error(`获取频道: {${guild.guild_name}} 子频道: ${channel_id} 信息失败!`);
    });
}


/**
 * 截断超出的字符串,截断部分用"..."表示
 * @note 自动替换换行消息
 */
function TruncateString(text: string, size: number) {
    if (text.length > size) {
        text = text.substring(0, size) + "...";
    }
    return text.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
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
async function AutoReplaceCQCode(msg: string, fn: (name: string, data: obj) => Promise<string>) {
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

/**
 * 处理OneBot频道事件(各类分支)
 */
async function ProcessOneBotGuildEvent(this: GuildSystem | undefined, obj: obj) {
    // console.log(obj)
    if (this == undefined) { return; }
    switch (obj.post_type as "message" | "notice") {
        case "message": {
            ProcessGuildMessage.call(this, obj);
            break;
        }
        case "notice": {
            ProcessGuildNotice.call(this, obj);
            break;
        }
    }
}

async function ProcessGuildMessage(this: GuildSystem, obj: obj) {
    // console.log(obj);
    let sender = new GuildSenderInfo(obj.sender);
    switch (obj.message_type as "guild") {
        case "guild": {
            let guild = await SafeGetGuild.call(this, obj.guild_id);
            let channel = await SafeGetChannel.call(this, guild, obj.channel_id);
            let msg = new GuildMsgInfo(obj.message, obj.message_id);
            await (function (this: OneBotDocking) {
                return this._MsgDB.setGuildMsg(msg.msg_id, {
                    "channel_id": channel.channel_id,
                    "guild_id": guild.guild_id,
                    "message": msg.msg,
                    "message_id": msg.msg_id,
                    "message_seq": -1,
                    "message_source": "channel",
                    "sender": obj.sender,
                    "reactions": [],
                    "time": obj.time
                });
            }).call(this.OneBotDocking);
            let member = await sender.getDetail(this, obj.guild_id, false);
            if (!member) { return; }
            this.events.onChannelMsg.fire(
                "GuildSystemProcess_Event_ChannelMsg",
                obj.time * 1000,
                guild,
                obj.sub_type,
                channel,
                member,
                msg
            );
            this.OneBotDocking.conf["MsgLog"] &&
                this.log.info(`[频道][${guild.guild_name}(${guild.guild_display_id})] ${sender.nickname} >> ${TruncateString(await AutoReplaceCQCode(msg.originalContent, async (name, data) => {
                    if (name.toLowerCase() == "at") {
                        let user = (await guild.getGuildMember(this, data["qq"], false));
                        if (user == null) {
                            name = "@" + data["qq"];
                        } else { name = "@" + user.nickname; }
                    }
                    return `§e${name}§d`;
                }), 100)}`);
        }
    }
}

async function ProcessGuildNotice(this: GuildSystem, obj: obj) {
    let channelUpdateType: "add" | "del" | "update" | "" = "";
    switch (obj.notice_type as "message_reactions_updated" | "channel_updated" | "channel_created" | "channel_destroyed") {
        case "message_reactions_updated": {
            let guild = await SafeGetGuild.call(this, obj.guild_id);
            let channel = await SafeGetChannel.call(this, guild, obj.channel_id);
            // console.log(obj)
            // let member = await this.getGuildMemberProfileEx(guild.guild_id, obj.user_id);
            // if (!member) { return; }
            let member = undefined;
            let reactionInfos = new ReactionInfos(obj.current_reactions);
            this.events.onChannelMsgReactionUpdated.fire(
                "GuildSystemProcess_Event_ChannelMsgReactionUpdate",
                obj.time * 1000,
                guild,
                channel,
                member,
                reactionInfos
            );
            break;
        }
        case "channel_updated": channelUpdateType = "update"; break;
        case "channel_created": channelUpdateType = "add"; break;
        case "channel_destroyed": channelUpdateType = "del"; break;
    }

    if (!!channelUpdateType) {
        let guild = await SafeGetGuild.call(this, obj.guild_id);
        let newChannel: GuildChannelInfo | undefined;
        let oldChannel: GuildChannelInfo | undefined;
        switch (channelUpdateType) {
            case "update": {
                oldChannel = new GuildChannelInfo(obj.old_info);
                newChannel = new GuildChannelInfo(obj.new_info);
                break;
            }
            case "add": {
                newChannel = new GuildChannelInfo(obj.channel_info);
                break;
            }
            case "del": {
                oldChannel = new GuildChannelInfo(obj.channel_info);
                break;
            }
        }
        this.events.onChannelInfoUpdated.fire(
            "GuildSystemProcess_Event_ChannelInfoUpdate",
            obj.time * 1000,
            guild,
            channelUpdateType,
            obj.channel_id,
            newChannel
        );
        guild._updateChannelInfo(channelUpdateType, (newChannel || oldChannel)!);
    }
}

export class GuildSystem {
    static ProcessOneBotGuildEvent = ProcessOneBotGuildEvent;
    private _Profile = { "nickname": "Unknown", "tiny_id": "-1", "avatar_url": "" }
    protected _Guilds = new Map<string, GuildInfo>();
    //同步主类的方法,在初始化后自动赋值
    private _MsgDB: MessageDB;
    protected get log() { return this._this.logger; }
    private DelayLogger = { "error": (...msg: any[]) => { this.log.error(...msg); } };
    private _event = {
        /**子频道消息*/
        "onChannelMsg": new TEvent<(guild: GuildInfo, sub_type: "channel", channel: GuildChannelInfo, member: GuildMemberProfileInfo, msg: GuildMsgInfo) => void>(this.DelayLogger),
        /**子频道表情贴更新
         * @note 由于机器人原因,文档所提供的user_id有问题,所以现在的user参数固定为undefined
         */
        "onChannelMsgReactionUpdated": new TEvent<(guild: GuildInfo, channel: GuildChannelInfo, user: GuildMemberProfileInfo | undefined, reactions: ReactionInfos) => void>(this.DelayLogger),
        /**
         * 子频道信息更新
         * @note 旧数据使用 GuildInfo.getChannel 获取
         */
        "onChannelInfoUpdated": new TEvent<(guild: GuildInfo, sub_type: ("add" | "del" | "update"), channel_id: string, new_data: GuildChannelInfo | undefined) => void>(this.DelayLogger)
    };
    //这里的运行时间在主类初始化之前,不推荐在这写关于机器人ws接口的操作
    constructor(protected _this: OneBotDocking) {
        this._MsgDB = {} as MessageDB;
    }
    /** 在主类执行_Init的时候这玩意会自动执行 */
    async _Init() {
        this.log.info(`§l§e----------------`);
        let InitMsgLog = this._this.conf["InitMsgLog"];
        if (
            !(await this._loadSelfProfile(true)) ||
            !(await this._loadAllGuildInfo(InitMsgLog))
        ) {
            this.log.warn(`初始化频道信息失败!无法使用频道系统!`);
            return false;
        }
        this._MsgDB = (function (this: OneBotDocking) { return this._MsgDB }).call(this._this);
        this.log.info(`初始化频道信息完成!`);
        return true;
    }
    async _loadSelfProfile(bool: boolean) {
        let res = await this.getGuildServiceProfile();
        if (res.data != null) {
            this._Profile.nickname = res.data.nickname;
            this._Profile.tiny_id = res.data.tiny_id;
            this._Profile.avatar_url = res.data.avatar_url;
            bool && this.log.info(`获取频道Bot资料完成: (${this._Profile.nickname})`);
            return true;
        }
        this.log.error(`获取频道Bot资料失败!原因: ${res.msg}(${res.wording})`);
        return false;
    }
    async _loadAllGuildInfo(bool: boolean) {
        this._Guilds.clear();
        let list = await this.getGuildListEx();
        let l = list.length, i = 0;
        while (i < l) {
            let guild = list[i];
            if (!(await guild._init(this, bool))) {
                return false;
            }
            this._Guilds.set(guild.guild_id, guild);
            i++;
        }
        return true;
    }


    get OneBotDocking() { return this._this; }
    get events() { return this._event; }
    // /** 不推荐直接使用,此属性为內部API专用 */
    // get Guilds() { return this._Guilds; }

    getGuildSync(guild_id: string) {
        return this._Guilds.get(guild_id);
    }
    getGuildListSync() {
        let arr: GuildInfo[] = [];
        let values = this._Guilds.values();
        let value = values.next();
        while (!value.done) {
            arr.push(value.value);
            value = values.next();
        }
        return arr;
    }

    /** 
     * ``` txt
     * 没有加入任何讨论组返回空数组 
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildListEx() {
        let res = await (this.getGuildList().setData(false));
        let arr: GuildInfo[] = [];
        if (res.data == null) { return arr; }
        let i = 0, l = res.data.length;
        while (i < l) {
            arr.push(new GuildInfo(res.data[i]));
            i++;
        }
        return arr;
    }

    /** 
     * ``` txt
     * 通过访客方式获取频道元数据
     * go-cqhttp v1.0.1无法使用
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildMetaByGuestEx(guild_id: string) {
        let res = await (this.getGuildMetaByGuest(guild_id).setData(false));
        if (res.data == null) {
            this.log.error(`获取频道 ${guild_id} 元数据失败!原因: ${res.msg}(${res.wording})`);
            return;
        }
        return new GuildMetaInfo(res.data);
    }

    /**
     * ``` txt
     * 获取子频道列表
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildChannelListEx(guild_id: string, no_cache = false) {
        let res = await (this.getGuildChannelList(guild_id, no_cache).setData(false));
        if (res.data == null) {
            this.log.error(`获取频道 ${guild_id} 子频道列表失败!原因: ${res.msg}(${res.wording})`);
            return;
        }
        let arr: GuildChannelInfo[] = [];
        let l = res.data.length, i = 0;
        while (i < l) {
            arr.push(new GuildChannelInfo(res.data[i]));
            i++;
        }
        return arr;
    }

    /**
     * ``` txt
     * 获取频道成员列表
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildMemberListEx(guild_id: string) {
        let w = async (nextToken?: string): Promise<GuildMemberListIters | undefined> => {
            let res = await this.getGuildMemberList(guild_id, nextToken);
            if (res.data == null) {
                this.log.error(`无法获取频道 ${guild_id} 成员列表!原因: ${res.msg}(${res.wording})`);
                return;
            }
            let { members, finished, next_token } = res.data;
            let mems: GuildMemberInfo[] = [];
            let l = members.length, i = 0;
            while (i < l) {
                mems.push(new GuildMemberInfo(members[i]));
                i++;
            }
            if (finished) {
                return {
                    "finished": finished as boolean,
                    "next": undefined,
                    "token": undefined,
                    "members": mems
                };
            } else {
                return {
                    "finished": finished as boolean,
                    "next": async () => {
                        return await w(next_token);
                    },
                    "token": next_token,
                    "members": mems
                };
            }
        }
        return await w();
    }

    /**
     * ``` txt
     * 单独获取频道成员信息
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildMemberProfileEx(guild_id: string, tiny_id: string, no_cache = false) {
        let guild = this._Guilds.get(guild_id);
        if (!no_cache) {
            if (!!guild) {
                let memberCache = (function (this: GuildInfo) { return this.MemberCache; }).call(guild);
                if (memberCache.has(tiny_id)) { return memberCache.get(tiny_id)!; }
            }
        }
        let res = await (this.getGuildMemberProfile(guild_id, tiny_id).setData(false));
        if (res.data == null) {
            this.log.error(`获取频道 ${guild_id} 成员 ${tiny_id} 信息失败!原因: ${res.msg}(${res.wording})`);
            return;
        }
        let res1 = new GuildMemberProfileInfo(res.data);
        //不管是否使用缓存都要添加缓存信息
        // if (!no_cache) {
        if (!!guild) {//添加缓存
            (function (this: GuildInfo) { return this.MemberCache; }).call(guild!)
                .set(tiny_id, res1);
        }
        // }
        return res1;
    }

    /**
     * ``` txt
     * 获取话题频道帖子
     * 加强版(自动转换返回类型)
     * ```
     */
    async getTopicChannelFeedsEx(guild_id: string, channel_id: string) {
        let res = await (this.getTopicChannelFeeds(guild_id, channel_id).setData(false));
        if (res.data == null) {
            this.log.error(`获取话题频道帖子失败!原因: ${res.msg}(${res.wording})`);
            return;
        }
        let arr: FeedInfo[] = [];
        res.data.forEach((d: any) => { arr.push(new FeedInfo(d)); });
        return arr;
    }

    /**
     * ``` txt
     * 获取频道角色(身份组)列表
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildRolesEx(guild_id: string) {
        let res = await (this.getGuildRoles(guild_id).setData(false));
        if (res.data == null) {
            this.log.error(`获取频道权限组失败!原因: ${res.msg}(${res.wording})`);
            return;
        }
        let arr: GuildRole[] = [];
        let l = res.data.length, i = 0;
        while (i < l) {
            arr.push(new GuildRole(res.data[i], guild_id));
            i++;
        }
        return arr;
    }

    /**
     * ``` txt
     * 删除频道角色(身份组)
     * 加强版(自动判断是否成功,-1无身份组或出错,0失败,1成功)
     * ```
     */
    async deleteGuildRoleEx(guild_id: string, role_id: string) {
        let data = await this.getGuildRolesEx(guild_id);
        let hasRole = (data: GuildRole[], role_id: string) => {
            return data.findIndex((v) => {
                if (v.role_id == role_id) {
                    return true;
                }
                return false;
            }) != -1
        }
        if (data == null || !hasRole(data, role_id)) {
            return -1;
        }
        await this.deleteGuildRole(guild_id, role_id);
        // await new Promise<void>((r) => setTimeout(r, 1000));//sleep 1s
        data = await this.getGuildRolesEx(guild_id);
        if (data == null) { return -1; }
        return +!hasRole(data, role_id);
    }

    /**
     * ``` txt
     * 设置用户在频道中的角色(身份组)
     * 增强版本,自动判断设置是否成功,批量设置身份组请直接使用Ws接口;setGuildMemberRole 
     * -1无身份组或出错,0失败,1成功
     * ```
     */
    async setGuildMemberRoleEx(guild_id: string, set: boolean, role_id: string, user: string) {
        let roles = ((await this.getGuildRolesEx(guild_id)) || []);
        if (roles.findIndex((v) => v.role_id == role_id) == -1) {//无法找到身份组
            return -1;
        }
        let gmp = await this.getGuildMemberProfileEx(guild_id, user, true);
        if (gmp == null) { return -1; }//获取角色信息失败
        if (gmp.findRole((v) => v.role_id == role_id) != null) { return 1; }//如果成员有身份组信息直接返回成功
        await (this.setGuildMemberRole(guild_id, set, role_id, [user]).setData(false));
        gmp = await this.getGuildMemberProfileEx(guild_id, user, true);
        if (gmp == null) { return -1; }//获取角色信息失败
        return +(gmp.roles.findIndex((v) => v.role_id == role_id) != -1);
    }

    /** 
     * ``` txt
     * 发送频道消息
     * 加强版(自动转换返回类型) 
     * ```
     * 警告！频道消息只支持部分CQ码
     * * 详情见: [ https://docs.go-cqhttp.org/guild/#%E5%91%BD%E5%90%8D%E8%AF%B4%E6%98%8E ]
     */
    async sendMsgEx(guild_id: string, channel_id: string, msg: Msg_Info[] | string) {
        let res = await (this.sendGuildChannelMsg(guild_id, channel_id, msg).setData(false));
        if (res.data == null) {
            this.log.error(`发送频道 ${guild_id}(${channel_id}) 消息失败!原因: ${res.msg}(${res.wording})`);
            return;
        }
        return res.data.message_id as string;
    }

    /**
     * 获取消息信息
     * 使用本地leveldb获取会出现的问题:
     * message_seq字段缺失
     * reactions字段缺失
     * 以上问题如影响插件功能请务必通告用户
     * @param msg_id 
     */
    async getGuildMsgEx(msg_id: string) {
        let res = await (this.getGuildMsg(msg_id));
        if (res.data == null) {
            this.log.error(`获取频道消息: ${msg_id} 失败!原因: ${res.msg}(${res.wording})`);
            return;
        }
        return new GuildMsgInfoEx(res.data);
    }

    /**
     * 获取消息信息
     * 使用本地leveldb获取会出现的问题:
     * message_seq字段缺失
     * reactions字段缺失
     * 以上问题如影响插件功能请务必通告用户
     * @param msg_id 
     */
    getGuildMsg(msg_id: string) {
        let err = new Error("Error Stack");
        return new TMBotPromise<ret_data_struct, boolean>(async (ret, rj, getData) => {
            if (this._this.conf["GetMsgUseLevelDB"]) {
                let data = await this._MsgDB.getGuildMsg(msg_id);
                let res: ret_data_struct = {
                    "message": !data ? `没有找到消息: ${msg_id}` : "",
                    "data": data as any,
                    "status": "ok",
                    "retcode": 0,
                    "echo": "-114514",
                    "msg": !data ? "GET_MSG_API_ERROR" : undefined,
                    "wording": !data ? `没有找到消息: ${msg_id}` : undefined
                };
                if (!data) {
                    rj(res);
                    this.log.error(`LevelDB [get_guild_msg] 调用错误回执: ${res.msg}(${res.wording})`);
                    if (getData()) {
                        ErrorPrint(`On_LevelDB_Get_Guild_Msg`, `${res.msg}(${res.wording!})`, `发送数据:
\`\`\`json
${{ "message_id": msg_id }}
\`\`\`
调用堆栈:
\`\`\`txt
${err.stack}
\`\`\``, this.log);

                    }
                }
                ret(res);
                return;
            }
            this._this._SendRequest("get_guild_msg", { "message_id": msg_id }, (v) => {
                ret(v);
            }, (data) => {
                rj(data);
                return getData();
            }, err);
        }, true);
    }



    //Ws API
    /**
     * 获取频道系统内BOT的资料
     */
    getGuildServiceProfile() {
        return this._this._SendReqPro("get_guild_service_profile", {});
    }
    /** 获取已加入频道列表 */
    getGuildList() {
        return this._this._SendReqPro("get_guild_list", {});
    }
    /** 通过访客方式获取频道元数据(暂不可用) */
    getGuildMetaByGuest(guild_id: string) {
        return this._this._SendReqPro("get_guild_meta_by_guest", { guild_id });
    }
    /** 获取子频道列表 */
    getGuildChannelList(guild_id: string, no_cache: boolean) {
        return this._this._SendReqPro("get_guild_channel_list", { guild_id, no_cache });
    }
    /** 获取频道成员列表 */
    getGuildMemberList(guild_id: string, next_token?: string | undefined) {
        let obj: obj = { guild_id };
        if (!!next_token) { obj["next_token"] = next_token; }
        return this._this._SendReqPro("get_guild_member_list", obj);
    }
    /** 单独获取频道成员信息 */
    getGuildMemberProfile(guild_id: string, user_id: string) {
        return this._this._SendReqPro("get_guild_member_profile", { guild_id, user_id });
    }
    /** 发送信息到子频道 */
    sendGuildChannelMsg(guild_id: string, channel_id: string, message: string | Msg_Info[]) {
        return this._this._SendReqPro("send_guild_channel_msg", { guild_id, channel_id, message });
    }
    /** 获取话题频道帖子 */
    getTopicChannelFeeds(guild_id: string, channel_id: string) {
        return this._this._SendReqPro("get_topic_channel_feeds", { guild_id, channel_id });
    }
    /** 删除频道角色(身份组)(无返回数据) */
    deleteGuildRole(guild_id: string, role_id: string) {
        return this._this._SendReqPro("delete_guild_role", { guild_id, role_id });
    }
    /** 获取频道角色(身份组)列表 */
    getGuildRoles(guild_id: string) {
        return this._this._SendReqPro("get_guild_roles", { guild_id });
    }
    /** 设置用户在频道中的角色(无返回数据) */
    setGuildMemberRole(guild_id: string, set: boolean, role_id: string, users: string[] = []) {
        return this._this._SendReqPro("set_guild_member_role", { guild_id, set, role_id, users })
    }

    toString() {
        return `<Class::${this.constructor.name}>\n${this._this.Name}`;
    }
}