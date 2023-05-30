import { GuildSystem, OneBotDocking } from "../OneBotDocking";
import { Msg_Info } from "../QQDataTypes/MsgInfo";
import { SlowModeInfo } from "./SlowModeInfo";

/**
 * 子频道信息
 */
export class ChannelInfo {
    private slowModes: SlowModeInfo;
    constructor(private obj: {
        "owner_guild_id": string,	//所属频道ID
        "channel_id": string,	//子频道ID
        "channel_type": number,	//子频道类型
        "channel_name": string,	//子频道名称
        "create_time": number,	//创建时间
        "creator_tiny_id": string,	//创建者ID
        "talk_permission": number,	//发言权限类型
        "visible_type": number,	//可视性类型
        "current_slow_mode": number,	//当前启用的慢速模式Key
        "slow_modes": {                 //频道内可用慢速模式类型列表
            "slow_mode_key": number,	//慢速模式Key
            "slow_mode_text": string,	//慢速模式说明
            "speak_frequency": number,	//周期内发言频率限制
            "slow_mode_circle": number	//单位周期时间, 单位秒
        }
    }) { this.slowModes = new SlowModeInfo(obj.slow_modes); };
    /** 所属频道ID */
    get owner_guild_id() { return this.obj.owner_guild_id; }
    /** 子频道ID */
    get channel_id() { return this.obj.channel_id; }
    /** 
     * 子频道类型
     * ```
     * 已知子频道类型列表
     * 
     * 类型	说明
     * 1	文字频道
     * 2	语音频道
     * 5	直播频道
     * 7	主题频道
     * ```
     */
    get channel_type() { return this.obj.channel_type; }
    /** 子频道名称 */
    get channel_name() { return this.obj.channel_name; }
    /** 创建时间 */
    get create_time() { return this.obj.create_time; }
    /** 创建者ID */
    get creator_tiny_id() { return this.obj.creator_tiny_id; }
    /** 发言权限类型(文档没写这玩意的具体类型) */
    get talk_permission() { return this.obj.talk_permission; }
    /** 可视性类型 */
    get visible_type() { return this.obj.visible_type; }
    /** 当前启用的慢速模式Key */
    get current_slow_mode() { return this.obj.current_slow_mode; }
    /** 频道内可用慢速模式类型列表 */
    get slow_modes() { return this.slowModes; }

    /** 获取所属频道 */
    getGuild(_this: GuildSystem) {
        return _this.getGuildSync(this.obj.owner_guild_id);
    }

    /**
     * 警告！频道消息只支持部分CQ码
     * * 详情见: [ https://docs.go-cqhttp.org/guild/#%E5%91%BD%E5%90%8D%E8%AF%B4%E6%98%8E ]
     */
    sendMsg(_this: GuildSystem, msg: string | Msg_Info[]) {
        return this.getGuild(_this)!.sendMsg(_this, this.channel_id, msg)
    }
}