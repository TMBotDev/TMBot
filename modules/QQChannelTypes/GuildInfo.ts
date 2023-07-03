import { GlobalEvent } from "../RunTime/Global";
import { GuildSystem } from "../OneBotDocking";
import { Msg_Info } from "../QQDataTypes/MsgInfo";
import { GuildChannelInfo } from "./GuildChannelInfo";
import { GuildMemberProfileInfo } from "./GuildMemberInfo";


class DataCache<T, TT> extends Map<T, TT> {
    private data: [T, number][] = [];
    private sid: NodeJS.Timer | number;
    constructor(sec: number, entries?: readonly (readonly [T, TT])[] | null) {
        super(entries);
        let time = (sec * 1000);
        this.sid = setInterval(() => {
            let now = Date.now();
            let t = true;
            while (t) {
                let f = this.data[0];
                if (!f) { t = false; return; }
                if ((now - f[1]) >= time) {
                    // console.log("delete:" + f[0]);
                    this.delete(f[0]);
                    this.data.shift();
                }
                t = false;
            }
        }, 1000 * 10);
        GlobalEvent.onTMBotStop.on(() => {
            this.close();
        });
    }
    /** 请使用has来确认是否存在 */
    putCache(k: T, v: TT) {
        if (!!this.data.find((v) => { return v[0] == k; })) { return this; }
        this.data.push([k, Date.now()]);
        return this.set(k, v);
    }
    close() {
        clearInterval(this.sid);
        return true;
    }
}

export class GuildInfo {
    private ChannelMap = new Map<string, GuildChannelInfo>();
    protected MemberCache = new DataCache<string, GuildMemberProfileInfo>(60 * 30);//半小时
    constructor(private obj: {
        "guild_id": string,
        "guild_name": string,
        "guild_display_id": number
    }) { }
    async _init(_this: GuildSystem, bool = _this.OneBotDocking.conf["InitMsgLog"]) {
        let log = _this.log;
        bool && log.info(`初始化频道 ${this.obj.guild_name} 子频道信息...`);
        let cls = await _this.getGuildChannelListEx(this.obj.guild_id, true);
        if (!cls) { log.error(`获取频道 ${this.obj.guild_name} 子频道信息失败!`); return false; }
        let l = cls.length, i = 0;
        while (i < l) {
            let cl = cls[i];
            this.ChannelMap.set(cl.channel_id, cl);
            i++;
        }
        return true;
    }
    _updateChannelInfo(type: "update" | "del" | "add", channelInfo: GuildChannelInfo) {
        switch (type) {
            case "add":
            case "update": {
                this.ChannelMap.set(channelInfo.channel_id, channelInfo);
                break;
            }
            case "del": {
                this.ChannelMap.delete(channelInfo.channel_id);
                break;
            }
        }
    }
    /** 频道ID */
    get guild_id() { return this.obj.guild_id; }
    /** 频道名称 */
    get guild_name() { return this.obj.guild_name; }
    /** 频道显示ID */
    get guild_display_id() { return this.obj.guild_display_id; }
    /** 获取子频道信息 */
    getChannel(channel_id: string) { return this.ChannelMap.get(channel_id); }
    /** 获取子频道列表 */
    getChannelList() {
        let arr: GuildChannelInfo[] = [];
        let iter = this.ChannelMap.entries();
        let now = iter.next();// as IteratorReturnResult<[string, ChannelInfo]>;
        while (!now.done) {
            let val = now.value;
            arr.push(val[1]);
            now = iter.next()// as IteratorReturnResult<[string, ChannelInfo]>;
        }
        return arr;
    }
    getGuildMember(_this: GuildSystem, tiny_id: string, no_cache = false) {
        return _this.getGuildMemberProfileEx(this.obj.guild_id, tiny_id, no_cache);
    }
    /**
     * ```
     * 方便函数,快捷发送消息
     * ```
     * 警告！频道消息只支持部分CQ码
     * * 详情见: [ https://docs.go-cqhttp.org/guild/#%E5%91%BD%E5%90%8D%E8%AF%B4%E6%98%8E ]
     */
    sendMsg(_this: GuildSystem, channel_id: string, msg: Msg_Info[] | string) {
        return _this.sendMsgEx(this.obj.guild_id, channel_id, msg);
    }

    toString() {
        return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj, null, 2)}`;
    }
}