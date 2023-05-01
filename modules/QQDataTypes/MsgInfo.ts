import { OneBotDocking, SenderInfo, obj } from "../OneBotDocking";

export type Msg_Info = {
    "type": string,
    "data": { [key: string]: string }
};

function AutoEscape(s: string) {
    return s.replace(/&amp\;/g, "&")
        .replace(/&#91\;/g, "[")
        .replace(/&#93\;/g, "]")
        .replace(/&#44\;/g, ",");
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
            if (end == -1) {//ori
                arr.push({ "type": "text", "data": { "text": AutoEscape(content) } });
            } else {
                let endStr = AutoEscape(content.substring(end + 1));//末尾字符串
                let CQCodeContent = content.substring(0, end).split(",");
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

/**
 * 消息信息
 */
export class MsgInfo {
    private _msgInfoArray: Msg_Info[];
    constructor(private obj: {
        "message": string | Msg_Info[],
        "raw_message": string,
        "message_id": number
    }) {
        if (typeof (this.obj.message) == "string") {
            this._msgInfoArray = CQCodeStrMsgToMsgInfoArrMsg(this.obj.message);
        } else {
            this._msgInfoArray = obj.message as Msg_Info[];
        }
    }
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
        return AutoEscape(this.obj.raw_message);
    }
    get msg() { return this.obj.message; }
    get raw() { return this.obj.raw_message; }
    get msg_id() { return this.obj.message_id; }
    /**
     * 消息信息数组
     */
    get msgInfoArray() {
        return this._msgInfoArray;
    }
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
            str += mi.data.text.replace(/&/g, "&amp;")
                .replace(/\[/g, "&#91;")
                .replace(/\]/g, "&#93;")
                .replace(/,/g, "&#44;");
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
 * ``` markdown
 * ## 消息构建器
 * 数据类型参考<https://docs.go-cqhttp.org/cqcode/#%E5%9B%BE%E7%89%87>
 * ```
 */
export class MsgInfoBuilder {
    public context: Msg_Info[] = [];
    private only = false;
    constructor() { }
    /** 添加文本(自动转义特殊字符) */
    addText(text: string) {
        if (this.only) { return; }
        //这个不用转义
        // text = text.replace(/&/g, "&amp;")
        //     .replace(/\[/g, "&#91;")
        //     .replace(/\]/g, "&#93;")
        //     .replace(/,/g, "&#44;");
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
     * * 这里的绝对路径指的是ws服务(机器人登录)运行的路径
     * 也可以使用base64(格式:base64://iVBORw0KGgoAAAANSUhEUgAAABQAA...)
     * * 填写上述数据后可忽略后边参数,如果此参数为名称时请填写后边参数
     * ```
     * @param url 语音网址
     * @param cache 是否使用缓存
     * @param proxy 是否使用代理下载
     * @param timeout 下载超时时间
     */
    setRecord(
        file: string,
        url: string | undefined = undefined,
        cache: "0" | "1" = "1",
        proxy: "0" | "1" = "1",
        timeout: string | undefined = undefined
    ) {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        let data: { [k: string]: string } = { file, cache, proxy };
        if (url != null) { data.url = url; }
        if (timeout != null) { data.timeout = timeout; }
        this.context.push({
            "type": "record",
            "data": data
        });
        return this;
    }

    /**
     * ```
     * 设置为视频消息
     * 因为视频里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @param file ``` markdown
     * 可以为网址或者绝对路径(使用格式:file:///C:\\a.mp3)
     * * 这里的绝对路径指的是ws服务(机器人登录)运行的路径
     * 这里base64我不知道能不能用哈,自己试(doge)
     * ```
     * @param cover 视频封面, 支持http, file和base64发送, 格式必须为jpg
     * @param c 通过网络下载视频时的线程数, 默认单线程. (在资源不支持并发时会自动处理)
     */
    setVideo(file: string, cover: string, c: number = 2) {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        this.context.push({
            "type": "video",
            "data": { file, cover, "c": c + "" }
        });
        return this;
    }

    /** 
     * 添加at
     * @param qq QQ号,all表示全体成员
     * @param name 当在群中找不到此QQ号的名称时才会生效
     */
    addAt(qq: string | "all", name: string = "") {
        if (this.only) { return; }
        this.context.push({
            "type": "at",
            "data": { qq, name }
        });
        return this;
    }

    /**
     * ```
     * 设置猜拳魔法表情
     * 因为猜拳里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @deprecated 该 CQcode 暂未被 go-cqhttp 支持, 您可以提交 pr 以使该 CQcode 被支持 提交 pr
     */
    setRps() {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        this.context.push({
            "type": "rps",
            "data": {}
        });
        return this;
    }

    /**
     * ```
     * 设置掷骰子魔法表情
     * 因为掷骰子里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @deprecated 该 CQcode 暂未被 go-cqhttp 支持, 您可以提交 pr 以使该 CQcode 被支持 提交 pr
     */
    setDice() {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        this.context.push({
            "type": "dice",
            "data": {}
        });
        return this;
    }

    /**
     * ```
     * * 设置掷骰子魔法表情
     * 因为掷骰子里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @deprecated 该 CQcode 暂未被 go-cqhttp 支持, 您可以提交 pr 以使该 CQcode 被支持 提交 pr
     */
    setShake() {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        this.context.push({
            "type": "shake",
            "data": {}
        });
        return this;
    }

    /**
     * 匿名发消息
     * ```
     * 因为匿名消息里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @deprecated 该 CQcode 暂未被 go-cqhttp 支持, 您可以提交 pr 以使该 CQcode 被支持 提交 pr
     */
    setAnonymous() {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        this.context.push({
            "type": "anonymous",
            "data": {}
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

    toCQCodeString() {
        return Msg_InfoToStringMsg(this.context);
    }
}