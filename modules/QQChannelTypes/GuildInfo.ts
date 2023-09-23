import { GlobalEvent } from "../RunTime/Global";
import { GuildSystem, OneBotDocking } from "../OneBotDocking";
import { Msg_Info } from "../QQDataTypes/MsgInfo";
import { GuildChannelInfo } from "./GuildChannelInfo";
import { GuildMemberProfileInfo } from "./GuildMemberInfo";

/**每个最大缓存1w条*/
const DATA_CACHE_MAX_COUNT = 0x2710;
/**最高允许冗余100条*/
const DATA_CACHE_MAX_COUNT_REDUND = 0x64;

let sleep = (t: number) => new Promise((r) => { setTimeout(r, t); });

async function CacheGC(this: DataCache<any, any>, ForceStop: () => boolean) {
    // console.log("WK...");
    if (this.map.size <= DATA_CACHE_MAX_COUNT) {
        // console.log("WKD:0ms,sz:", this.size);
        return;
    }
    let delMs = this.delSec * 1000;
    let iters = this.map.keys();
    let iter = iters.next();
    let startTime = Date.now();
    // let st1 = startTime;
    // let c = 0;
    while (!iter.done) {
        if (ForceStop()) { return; }
        let key = iter.value;
        // if (this.size <= DATA_CACHE_MAX_COUNT) { break; }//注释掉可能更省内存使用?
        if ((startTime - (this.getCacheSaveTime(key) || 0)) >= delMs || this.size > (DATA_CACHE_MAX_COUNT + DATA_CACHE_MAX_COUNT_REDUND)) {
            this.delete(key);
            // c++;
        }
        iter = iters.next();
        if (Date.now() - startTime >= 50) {
            startTime = Date.now();
            sleep(1);//累了,睡会儿...
        }
    }
    // console.log("WKD:", Date.now() - st1, "ms,del:", c, ",sz:", this.map.size)
}

class DataCache<T, TT> {
    protected map: Map<T, { "time": number, "value": TT }> = new Map();
    private CG_Working = false;
    private sid: NodeJS.Timer | number;
    private ForceStopCmd = false;
    constructor(protected delSec: number, refreshSec: number) {
        this.sid = setInterval(() => {
            if (this.CG_Working) { return; }
            this.CG_Working = true;
            CacheGC.call(this, () => {
                if (this.ForceStopCmd) {
                    this.ForceStopCmd = false;
                    return true;
                }
                return false;
            }).then(() => { this.CG_Working = false; })
        }, refreshSec * 1000);
    }
    set(v1: T, v2: TT) {
        this.map.delete(v1);
        this.map.set(v1, { "time": Date.now(), "value": v2 });
        return this;
    }
    get(v1: T) {
        let res = this.map.get(v1);
        if (res == null) { return; }
        return res.value;
    }
    has(v1: T) { return this.map.has(v1); }
    getCacheSaveTime(v1: T) {
        let res = this.map.get(v1);
        if (res == null) { return; }
        return res.time;
    }
    delete(v1: T) {
        return this.map.delete(v1);
    }
    get size() { return this.map.size; }
    find(fn: (v1: T, v2: TT) => boolean): [T, TT] | undefined {
        let iters = this.map.entries();
        let iter = iters.next();
        while (!iter.done) {
            if (!!fn(iter.value[0], iter.value[1].value)) {
                return [iter.value[0], iter.value[1].value];
            }
            iter = iters.next();
        }
        return;
    }
    close() {
        clearInterval(this.sid);
        this.ForceStopCmd = true;
        return true;
    }
}

// let dc = new DataCache1(5, 5);
// let l = 0, i = 0;
// (async () => {
//     let breaking = false;
//     dc.close()
//     setTimeout(() => {
//         breaking = true;
//     }, 15 * 1000);
//     while (1) {
//         l += 1000;
//         for (; i < l; i++) {
//             dc.set(i + ``, Math.random())
//         }
//         if (breaking) { break; }
//         await sleep(Math.floor(Math.random() * 100))
//     }
// })();

// class DataCache<T, TT> extends Map<T, TT> {
//     private data: [T, number][] = [];
//     private sid: NodeJS.Timer | number;
//     constructor(sec: number, entries?: readonly (readonly [T, TT])[] | null) {
//         super(entries);
//         let time = (sec * 1000);
//         this.sid = setInterval(() => {
//             let now = Date.now();
//             let t = true;
//             while (t) {
//                 let f = this.data[0];
//                 if (!f) { t = false; return; }
//                 if ((now - f[1]) >= time) {
//                     // console.log("delete:" + f[0]);
//                     this.delete(f[0]);
//                     this.data.shift();
//                 }
//                 t = false;
//             }
//         }, 1000 * 10);
//         GlobalEvent.onTMBotStop.on(() => {
//             this.close();
//         });
//     }
//     /** 请使用has来确认是否存在 */
//     putCache(k: T, v: TT) {
//         if (!!this.data.find((v) => { return v[0] == k; })) { return this; }
//         this.data.push([k, Date.now()]);
//         return this.set(k, v);
//     }
//     close() {
//         clearInterval(this.sid);
//         return true;
//     }
// }

export class GuildInfo {
    private ChannelMap = new Map<string, GuildChannelInfo>();
    protected MemberCache = new DataCache<string, GuildMemberProfileInfo>(60 * 1, 5);//1分钟缓存,5秒检查一次
    constructor(private obj: {
        "guild_id": string,
        "guild_name": string,
        "guild_display_id": number
    }) { }
    async _init(_this: GuildSystem, bool = _this.OneBotDocking.conf["InitMsgLog"]) {
        let log = (function (this: GuildSystem) { return this.log; }).call(_this);
        bool && log.info(`初始化频道 ${this.obj.guild_name} 子频道信息...`);
        let cls = await _this.getGuildChannelListEx(this.obj.guild_id, true);
        if (!cls) { return false; }
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
     * ``` txt
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