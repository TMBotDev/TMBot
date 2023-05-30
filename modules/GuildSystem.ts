import { OneBotDocking } from "./OneBotDocking";
import { ChannelInfo } from "./QQChannelTypes/ChannelInfo";
import { GuildInfo } from "./QQChannelTypes/GuildInfo";
import { GuildMemberInfo, GuildMemberProfileInfo } from "./QQChannelTypes/GuildMemberInfo";
import { GuildMetaInfo } from "./QQChannelTypes/GuildMetaInfo";
import { Msg_Info } from "./QQDataTypes/MsgInfo";
import { TEvent } from "./TEvent";



export class GuildSystem {
    private _Profile = { "nickname": "Unknown", "tiny_id": "-1", "avatar_url": "" }
    private _Guilds = new Map<string, GuildInfo>();
    constructor(protected _this: OneBotDocking) { }//这里的运行时间在主类初始化之前
    private get log() { return this._this.logger; }
    private _event = {
        /**子频道消息*/
        "onChannelMsg": new TEvent<() => void>(this.log),
        /**子频道表情贴更新*/
        "onChannelReactionUpdate": new TEvent<() => void>(this.log),
        /**子频道信息更新*/
        "onChannelInfoUpdate": new TEvent<() => void>(this.log)
    };
    /** 在主类执行_Init的时候这玩意会自动执行 */
    async _Init() {
        this.log.info(`§l§e----------------`);
        this.log.info(`开始初始化频道信息...`);
        if (
            !(await this._loadSelfProfile()) ||
            !(await this._loadAllGuildInfo())
        ) {
            this.log.warn(`初始化频道信息失败!无法使用频道系统!`);
            return false;
        }
        // let list = await this.getGuildListEx();
        // let mems = await this.getGuildMemberListEx(list[0].guild_id);
        // let res = await this.getGuildMemberProfileEx(list[0].guild_id, mems?.members[0].user_id!);
        // let msgId = await this._this.sendMsgEx(1, 980444970, "[CQ:at,qq=2847696890] 测试", false);
        // let msg = await this._this.getMsgInfoEx(msgId);
        // this.log.info(msg?.toMsgInfo().raw);
        this.log.info(`初始化频道信息完成!`);
        return true;
    }
    async _loadSelfProfile() {
        this.log.info(`开始获取频道Bot资料...`);
        let res = await this.getGuildServiceProfile();
        if (res.data != null) {
            this._Profile.nickname = res.data.nickname;
            this._Profile.tiny_id = res.data.tiny_id;
            this._Profile.avatar_url = res.data.avatar_url;
            this.log.info(`获取频道Bot资料完成`);
            return true;
        }
        this.log.error(`获取频道Bot资料失败`);
        return false;
    }
    async _loadAllGuildInfo() {
        this._Guilds.clear();
        let list = await this.getGuildListEx();
        let l = list.length, i = 0;
        while (i < l) {
            let guild = list[i];
            if (!(await guild._init(this))) {
                return false;
            }
            this._Guilds.set(guild.guild_id, guild);
            i++;
        }
        return true;
    }


    get OneBotDocking() { return this._this; }

    getGuildSync(guild_id: string) {
        return this._Guilds.get(guild_id);
    }

    /** 
     * ```
     * 没有加入任何讨论组返回空数组 
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildListEx() {
        let res = await this.getGuildList();
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
     * ```
     * 通过访客方式获取频道元数据
     * go-cqhttp v1.0.1无法使用
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildMetaByGuestEx(guild_id: string) {
        let res = await this.getGuildMetaByGuest(guild_id);
        if (res.data == null) {
            this.log.error(`获取频道 ${guild_id} 元数据失败!`);
            return;
        }
        return new GuildMetaInfo(res.data);
    }

    /**
     * ```
     * 获取子频道列表
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildChannelListEx(guild_id: string, no_cache = false) {
        let res = await this.getGuildChannelList(guild_id, no_cache);
        if (res.data == null) {
            this.log.error(`获取频道 ${guild_id} 子频道列表失败!`);
            return;
        }
        let arr: ChannelInfo[] = [];
        let l = res.data.length, i = 0;
        while (i < l) {
            arr.push(new ChannelInfo(res.data[i]));
            i++;
        }
        return arr;
    }

    /**
     * ```
     * 获取频道成员列表
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildMemberListEx(guild_id: string) {
        let w = async (nextToken?: string) => {
            let res = await this.getGuildMemberList(guild_id, nextToken);
            if (res.data == null) {
                this.log.error(`无法获取频道 ${guild_id} 成员列表!`);
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
                    "finished": finished,
                    "next": undefined,
                    "token": undefined,
                    "members": mems
                }
            } else {
                return {
                    "finished": finished,
                    "next": async () => {
                        return await w(next_token);
                    },
                    "token": next_token,
                    "members": mems
                }
            }
        }
        return await w();
    }

    /**
     * ```
     * 单独获取频道成员信息
     * 加强版(自动转换返回类型)
     * ```
     */
    async getGuildMemberProfileEx(guild_id: string, tiny_id: string) {
        let res = await this.getGuildMemberProfile(guild_id, tiny_id);
        if (res.data == null) {
            this.log.error(`获取频道 ${guild_id} 成员 ${tiny_id} 信息失败!`);
            return;
        }
        return new GuildMemberProfileInfo(res.data);
    }

    /** 
     * ```
     * 发送频道消息
     * 加强版(自动转换返回类型) 
     * ```
     * 警告！频道消息只支持部分CQ码
     * * 详情见: [ https://docs.go-cqhttp.org/guild/#%E5%91%BD%E5%90%8D%E8%AF%B4%E6%98%8E ]
     */
    async sendMsgEx(guild_id: string, channel_id: string, msg: Msg_Info[] | string) {
        let res = await this.sendGuildChannelMsg(guild_id, channel_id, msg);
        if (res.data == null) {
            this.log.error(`发送频道 ${guild_id}(${channel_id}) 消息失败!`);
            return;
        }
        return res.data.message_id as string;
    }


    /**
     * 获取频道系统内BOT的资料
     */
    getGuildServiceProfile() {
        return this._this._SendReqPro("get_guild_service_profile", {});
    }
    /**
     * 获取已加入频道列表
     */
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
}