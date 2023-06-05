import { OneBotDocking, obj } from "../OneBotDocking";
import { Msg_Info } from "../QQDataTypes/MsgInfo";
import { GuildSenderInfo } from "./GuildSenderInfo";

function AutoEscape(s: string) {
    return s.replace(/&amp\;/g, "&")
        .replace(/&#91\;/g, "[")
        .replace(/&#93\;/g, "]")
        .replace(/&#44\;/g, ",");
}

function ObjToCQCodeData(data: obj) {
    let str = "";
    let keys = Object.keys(data);
    let l = keys.length, i = 0;
    while (i < l) {
        if (i != 0) { str += ","; }
        let k = keys[i], v = data[k];
        str += `${k}=${v}`;
        i++;
    }
    return str;
}

function Msg_InfoToStringMsg(msg: Msg_Info[]) {
    let str = "";
    let l = msg.length, i = 0;
    while (i < l) {
        let mi = msg[i];
        if (mi.type == "text") {
            str += mi.data.text;
        } else {
            let part = `[CQ:${mi.type},${ObjToCQCodeData(mi.data)}]`;
            str += part;
        }
        i++;
    }
    return str;
}

function CQContentToDataObj(content: string[]) {
    let obj: { [key: string]: string } = {};
    let l = content.length, i = 0;
    while (i < l) {
        let line = content[i];
        let [k, v] = line.split("=");
        obj[k] = v;
        i++;
    }
    return obj;
}

/**
 * CQCode字符串转CQCode数组
 */
function CQCodeStrMsgToMsgInfoArrMsg(msg: string) {
    let arr: Msg_Info[] = [];
    /**
     * [CQ:at,qq=123]asc [CQ:at,qq=ccccc]
     * ["CQ:at,qq=123]asc ", "CQ:at,qq=ccccc]"]
     */
    let e = msg.split("[");
    if (e[0] == "") {//解决出现空字符串问题
        e.shift();
    }
    let l = e.length, i = 0;
    while (i < l) {
        let content = e[i];
        if (content.indexOf("CQ:") == 0) {
            let end = content.indexOf("]");
            if (end == -1) {//未有结尾
                arr.push({ "type": "text", "data": { "text": AutoEscape(content) } });
            } else {
                let endStr = AutoEscape(content.substring(end + 1));//末尾字符串
                let CQCodeContent = AutoEscape(content.substring(0, end)).split(",");//附带转义数据
                let CQCodeName = CQCodeContent.shift()?.replace("CQ:", "");
                let CQCodeData = CQContentToDataObj(CQCodeContent);
                arr.push({ "type": CQCodeName!, "data": CQCodeData });
                if (!!endStr) {
                    arr.push({ "type": "text", "data": { "text": AutoEscape(endStr) } });
                }
            }
        } else {
            arr.push({ "type": "text", "data": { "text": AutoEscape(content) } });
        }
        i++;
    }
    return arr;
}

export class GuildMsgInfo {
    private raw_message: string;
    private _msgInfoArray: Msg_Info[];
    constructor(
        private _msg: string | Msg_Info[],
        private _msg_id: string
    ) {
        this.raw_message = typeof (_msg) == "string" ? _msg : Msg_InfoToStringMsg(_msg);
        if (typeof (_msg) == "string") {
            this._msgInfoArray = CQCodeStrMsgToMsgInfoArrMsg(_msg);
        } else {
            this._msgInfoArray = _msg;
        }
    }
    /** 撤回消息(方便函数)暂不可用 */
    deleteMsg(_this: OneBotDocking) {

    }
    get originalContent() {
        return AutoEscape(this.raw_message);
    }
    /**
     * 消息信息数组
     */
    get msgInfoArray() {
        return this._msgInfoArray;
    }
    get msg() { return this._msg; }
    get raw() { return this.raw_message; }
    get msg_id() { return this._msg_id; }
    toObject() {
        return {
            "message": this._msg,
            "message_id": this._msg_id
        };
    }
}


export type GuildMsgTypeEx = {
    "guild": boolean,
    "guild_id": string,
    "message": Msg_Info[] | string,
    "message_id": string,
    "message_type": "guild",
    "sender": { "nickname": string, "user_id": number, "tiny_id": string },
    "time": number
}

export class GuildMsgInfoEx {
    private _sender: GuildSenderInfo;
    private _msg: GuildMsgInfo;
    constructor(private obj: GuildMsgTypeEx) {
        this._sender = new GuildSenderInfo(obj.sender);
        this._msg = new GuildMsgInfo(obj.message, obj.message_id);
    }

    /** 是否为频道内消息 */
    get guild() { return this.obj.guild; }
    /** 频道ID */
    get guild_id() { return this.obj.guild_id; }
    /** 消息 */
    get message() { return this.obj.message; }
    /** 消息ID */
    get message_id() { return this.obj.message_id; }
    /** 消息类型 */
    get message_type() { return this.obj.message_type; }
    /** 发送者 */
    get sender() { return this.obj.sender; }
    /** 消息时间 */
    get time() { return this.obj.time; }
    /** 获取发送日期时间 */
    getTimeDate() { return new Date(this.obj.time * 1000); }
    /** 获取发送者信息 */
    getSender() { return this._sender; }
    /** 转换到GuildMsgInfo */
    toGuildMsgInfo() { return this._msg; }

    toObject() { return this.obj; }

}