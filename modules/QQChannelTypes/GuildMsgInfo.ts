import { OneBotDocking, obj } from "../OneBotDocking";
import { Msg_Info } from "../QQDataTypes/MsgInfo";


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

export class GuildMsgInfo {
    private raw_message: string;
    constructor(
        private _guild_id: string,
        private _channel_id: string,
        private _msg: string | Msg_Info[]) {
        this.raw_message = typeof (_msg) == "string" ? _msg : Msg_InfoToStringMsg(_msg);
    }
    /** 撤回消息(方便函数)暂不可用 */
    deleteMsg(_this: OneBotDocking) {

    }
    get originalContent() {
        return this.raw_message.replace(/&amp\;/g, "&")
            .replace(/&#91\;/g, "[")
            .replace(/&#93\;/g, "]")
            .replace(/&#44\;/g, ",");
    }
    get guild_id() { return this._guild_id; }
    get channel_id() { return this._channel_id; }
    get msg() { return this._msg; }
    get raw() { return this.raw_message; }
}