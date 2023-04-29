import { OneBotDocking, SenderInfo, obj } from "../OneBotDocking";

export type Msg_Info = {
    "type": string,
    "data": { [key: string]: string }
};

/**
 * 消息信息
 */
export class MsgInfo {
    constructor(private obj: {
        "message": string | Msg_Info[],
        "raw_message": string,
        "message_id": number
    }) { }
    /**
     * ```
     * 撤回消息
     * (可能因各种原因失败)
     * ```
     */
    delete(_this: OneBotDocking) {
        return _this.deleteMsg(this.obj.message_id);
    }
    /** 转义过特殊字符的 */
    get originalContent() {
        return this.obj.raw_message.replace(/&amp\;/g, "&")
            .replace(/&#91\;/g, "[")
            .replace(/&#93\;/g, "]")
            .replace(/&#44\;/g, ",");
    }
    get msg() { return this.obj.message; }
    get raw() { return this.obj.raw_message; }
    get msg_id() { return this.obj.message_id; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
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

/**
 * 消息信息(sendMsgEx函数所返回数据)
 */
export class MsgInfoEx {
    private _sender: SenderInfo
    constructor(private obj: {
        "group": boolean,
        "group_id": number | undefined,
        "message": Msg_Info[] | string,
        "message_id": number,
        "real_id": number,
        "message_type": "group",
        "sender": { "nickname": string, "user_id": number },
        "time": number
    }) { this._sender = new SenderInfo({ "nickname": obj.sender.nickname, "user_id": obj.sender.user_id, "age": 0, "sex": "unknown" }); }
    /** 是否为群消息 */
    get isGroupMsg() { return this.obj.group; }
    /** 群号 */
    get group_id() { return this.obj.group_id; }
    /** 消息ID */
    get message_id() { return this.obj.message_id; }
    /** 真实消息ID(不知道有什么用) */
    get real_id() { return this.obj.real_id; }
    /** 消息类型 */
    get message_type() { return this.obj.message_type; }
    /** 发送者 */
    get sender() { return this._sender; }
    /** 时间(秒) */
    get time() { return this.obj.time; }
    /** 获取发送日期时间 */
    getTimeDate() { return new Date(this.obj.time * 1000); }
    /** 转换到MsgInfo类(懒得在这个类实现些已有的东西了) */
    toMsgInfo() {
        let raw = typeof (this.obj.message) == "string" ? this.obj.message : Msg_InfoToStringMsg(this.obj.message);
        return new MsgInfo({ "message": this.obj.message, "message_id": this.obj.message_id, "raw_message": raw });
    }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}

/**
 * ``` text
 * 消息构建器
 * 数据类型参考 https://docs.go-cqhttp.org/cqcode/#%E5%9B%BE%E7%89%87
 * ```
 */
export class MsgInfoBuilder {
    public context: Msg_Info[] = [];
    private only = false;
    constructor() { }
    /** 添加文本(自动转义特殊字符) */
    addText(text: string) {
        if (this.only) { return; }
        text = text.replace(/&/g, "&amp;")
            .replace(/\[/g, "&#91;")
            .replace(/\]/g, "&#93;")
            .replace(/,/g, "&#44;");
        this.context.push({
            "type": "text",
            "data": { text }
        });
        return this;
    }

    /**
     * 添加表情
     * @param id 详见[ https://github.com/kyubotics/coolq-http-api/wiki/%E8%A1%A8%E6%83%85-CQ-%E7%A0%81-ID-%E8%A1%A8 ]
     */
    addFace(id: string) {
        if (this.only) { return; };
        this.context.push({
            "type": "face",
            "data": { id }
        });
        return this;
    }

    /**
     * ```
     * 设置为语音消息
     * 因为语音里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @param file ``` text
     * 可以为网址或者绝对路径(使用格式:file:///C:\\a.mp3)
     * 也可以使用base64(格式:base64://iVBORw0KGgoAAAANSUhEUgAAABQAA...)
     * ```
     */
    setRecord(
        file: string,
        url: string | undefined = undefined,
        cache: "0" | "1" = "1",
        proxy: "0" | "1" = "1",
        timeout: string | undefined = undefined
    ) {
        if (this.only) { return; }
        this.only = true;
        let data: { [k: string]: string } = { file, cache, proxy };
        if (url != null) { data.url = url; }
        if (timeout != null) { data.timeout = timeout; }
        this.reset();
        this.context.push({
            "type": "record",
            "data": data
        });
        return this;
    }

    setVideo() {

    }

    /** 添加at */
    addAt(qq: string): this {
        this.context.push({
            "type": "at",
            "data": { qq }
        });
        return this;
    }




    /**
     * 重新设置内容(可解除唯一属性)
     */
    reset() {
        this.only = false;
        this.context = [];
        return this;
    }

}