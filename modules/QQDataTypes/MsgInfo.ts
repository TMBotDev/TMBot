import { FriendInfo, GroupInfo, GroupMemberInfo, OneBotDocking, SenderInfo, obj } from "../OneBotDocking";

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


// let ForwardNodeMsgCacheMap = new Map<string, string>();

/**
 * 消息信息
 */
export class MsgInfo {
    private _msgInfoArray: Msg_Info[];
    private _isForwardNode: boolean = false;
    private _forwardId: string | undefined;
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
        if (this._msgInfoArray.length == 1) {//是否为合并转发消息
            try {
                let msg = this._msgInfoArray[0];
                if (msg.type == "forward") {
                    this._isForwardNode = true;
                    this._forwardId = msg.data["id"];
                } else if (msg.type == "json") {
                    let data = JSON.parse(msg.data["data"] || "{}");
                    if (data["app"] == "com.tencent.multimsg") {
                        this._isForwardNode = true;
                        this._forwardId = data["meta"]["detail"]["resid"];
                    }
                }
            } catch (_) {
                this._forwardId = undefined;
                this._isForwardNode = false;
            }
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

    /** 此消息是否是合并转发消息 */
    get isForwardNode() { return this._isForwardNode; }
    /** 合并转发消息ID */
    get forwardNodeId() { return this._forwardId; }
    getForwardNodeMsg() {

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
    }) { this._sender = new SenderInfo({ "nickname": obj.sender.nickname, "user_id": obj.sender.user_id, "age": 0, "sex": "unknown", "isGroupMember": false, "isGuildMember": false }); }
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

export enum ImageId {
    普通 = "40000",
    幻影 = "40001",
    抖动 = "40002",
    生日 = "40003",
    爱你 = "40004",
    征友 = "40005"
}

export enum ImageSubType {
    正常图片 = "0",
    表情包 = "1",
    热图 = "2",
    斗图 = "3",
    智图_不确定 = "4",
    贴图 = "7",
    自拍 = "8",
    贴图广告_不确定 = "9",
    Unknown_有待测试 = "10",
    热搜图 = "13"
}

export enum GiftId {
    甜_Wink = "0",
    快乐肥宅水 = "1",
    幸运手链 = "2",
    卡布奇诺 = "3",
    猫咪手表 = "4",
    绒绒手套 = "5",
    彩虹糖果 = "6",
    坚强 = "7",
    告白话筒 = "8",
    牵你的手 = "9",
    可爱猫咪 = "10",
    神秘面具 = "11",
    我超忙的 = "12",
    爱心口罩 = "13",
}

export type ForwardNodeData = {
    "type": "node",
    "data": {
        "id": string
    }
} | {
    "type": "node",
    "data": {
        "name": string,
        "uin": string,
        "content": Msg_Info[] | ForwardNodeData[] | string
    }
}

/**
 * ``` markdown
 * ## 消息构建器
 * 数据类型参考<https://docs.go-cqhttp.org/cqcode/#%E5%9B%BE%E7%89%87>
 * ```
 */
export class MsgInfoBuilder {
    private content: Msg_Info[] = [];
    private only = false;
    private forwardNode: undefined | ForwardNode;
    constructor() { }
    /** 添加文本(自动转义特殊字符) */
    addText(text: string) {
        if (this.only) { return; }
        //这个不用转义
        // text = text.replace(/&/g, "&amp;")
        //     .replace(/\[/g, "&#91;")
        //     .replace(/\]/g, "&#93;")
        //     .replace(/,/g, "&#44;");
        this.content.push({
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
        this.content.push({
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
        this.content.push({
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
        this.content.push({
            "type": "video",
            "data": { file, cover, "c": c + "" }
        });
        return this;
    }

    /** 
     * 添加at
     * @description ``` markdown
     * # 注意！
     * ## at消息无法作用于私聊!请注意!
     * ```
     * @param qq QQ号,all表示全体成员
     * @param name 当在群中找不到此QQ号的名称时才会生效
     */
    addAt(qq: string | "all", name: string = "") {
        if (this.only) { return; }
        this.content.push({
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
        this.content.push({
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
        this.content.push({
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
        this.content.push({
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
        this.content.push({
            "type": "anonymous",
            "data": {}
        });
        return this;
    }

    /**
     * 链接分享
     * ```
     * 因为链接分享里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @param content 发送时可选, 内容描述
     * @param image 发送时可选, 图片 URL
     */
    setShare(url: string, title: string, content: string = "", image: string = "") {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        let data: { [k: string]: string } = { url, title };
        if (!!content) { data["content"] = content; }
        if (!!image) { data["image"] = image; }
        this.content.push({
            "type": "share",
            "data": data
        });
        return this;
    }

    /**
     * 推荐好友/群
     * ```
     * 因为推荐好友/群里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @deprecated 该 CQcode 暂未被 go-cqhttp 支持, 您可以提交 pr 以使该 CQcode 被支持 提交 pr
     */
    setContact(type: "qq" | "group", id: string) {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        this.content.push({
            "type": "contact",
            "data": { type, id }
        });
        return this;
    }

    /**
     * 位置分享
     * ```
     * 因为位置分享里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @param lat 纬度
     * @param lon 经度
     * @deprecated 该 CQcode 暂未被 go-cqhttp 支持, 您可以提交 pr 以使该 CQcode 被支持 提交 pr
     */
    setLocation(lat: string, lon: string, title: string = "", content: string = "") {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        let data: { [k: string]: string } = { lat, lon };
        if (!!title) { data["title"] = title; }
        if (!!content) { data["content"] = content; }
        this.content.push({
            "type": "location",
            "data": data
        });
        return this;
    }

    /**
     * 音乐分享
     * ```
     * 因为音乐分享里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @param type 分别表示使用 QQ 音乐、网易云音乐、虾米音乐
     * @param id 音乐id
     */
    setMusic(type: "163" | "qq" | "xm", id: string) {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        this.content.push({
            "type": "music",
            "data": { type, id }
        });
        return this;
    }

    /**
     * 音乐自定义分享
     * ```
     * 因为音乐分享里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @param url 点击后跳转目标 URL
     * @param audio 音乐 URL
     * @param title 标题
     * @param content 发送时可选, 内容描述
     * @param image 发送时可选, 图片 URL
     */
    setCustomMusic(url: string, audio: string, title: string, content?: string, image?: string) {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        let data: { [k: string]: string } = {
            "type": "custom",
            url, audio, title
        };
        (!!content && (data["content"] = content));
        (!!image && (data["image"] = image));
        this.content.push({
            "type": "music",
            "data": data
        });
        return this;
    }

    /**
     * 添加图片
     * @param file ``` markdown
     * 图片文件名
     * 可以为网址或者绝对路径(使用格式:file:///C:\\a.mp3)
     * 也可以使用base64(格式:base64://iVBORw0KGgoAAAANSUhEUgAAABQAA...)
     * * 注意这里填的如果是图片文件名的话url参数必须填写!
     * * 这里的绝对路径指的是ws服务(机器人登录)运行的路径
     * ```
     * @param url 图片 URL
     * @param type 图片类型, flash 表示闪照, show 表示秀图, 默认普通图片
     * @param subType 图片子类型, 只出现在群聊.
     * @param id 发送秀图时的特效id, 默认为40000
     * @param cache 只在通过网络 URL 发送时有效, 表示是否使用已缓存的文件, 默认 1
     * @param c 通过网络下载图片时的线程数, 默认单线程. (在资源不支持并发时会自动处理)
     */
    addImage(
        file: string,
        url: string | undefined,
        type: "show" | "flash" = "show",
        subType: ImageSubType = ImageSubType.正常图片,
        id: ImageId = ImageId.普通,
        cache: "0" | "1" = "1",
        c: "2" | "3" | undefined
    ) {
        if (this.only) { return; }
        let data: { [k: string]: string } = {
            file, type, subType, id, cache
        };
        (!!url && (data["url"] = url));
        (!!c && (data["c"] = c));
        this.content.push({
            "type": "image",
            data
        });
        return this;
    }

    /**
     * 在消息最前方添加回复信息
     * ``` markdown
     * ## 注意!回复消息不能多次添加!
     * ## addReply和addCustomReply本质上是同一个东西!
     * ```
     * @param id 消息id
     */
    addReply(id: string) {
        if ((this.content[0] || {}).type == "reply" && this.only) { return; }
        this.content.push({
            "type": "reply",
            "data": {
                "id": id
            }
        });
        return this;
    }

    /**
     * 在消息最前方添加回复信息
     * ``` markdown
     * ## 注意!回复消息不能多次添加!
     * ## addReply和addCustomReply本质上是同一个东西!
     * ```
     * @param text 自定义回复的信息
     * @param qq 自定义回复时的自定义QQ, 如果使用自定义信息必须指定.
     * @param time 自定义回复时的时间, 格式为Unix时间(秒)
     * @param seq 起始消息序号, 可通过 get_msg 获得
     */
    addCustomReply(text: string, qq: string, time: string, seq?: string) {
        if ((this.content[0] || {}).type == "reply" && this.only) { return; }
        let data: { [k: string]: string } = {
            text, qq, time
        };
        (!!seq && (data["seq"] = seq));
        this.content.push({
            "type": "reply",
            "data": data
        });
        return this;
    }

    /**
     * 戳一戳
     * ```
     * 发送戳一戳消息无法撤回, 返回的 message id 恒定为 0
     * 因为戳一戳里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @param qq 私聊戳一戳填写好友qq号即可
     */
    setPoke(qq: string) {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        this.content.push({
            "type": "poke",
            "data": { qq }
        });
        return this;
    }

    /**
     * 礼物
     * ```
     * 仅支持免费礼物,发送礼物消息无法撤回, 返回的 message id 恒定为 0
     * 因为礼物里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
     * * 添加唯一属性
     * ```
     * @param qq 接收礼物的成员
     * @param id 礼物的类型
     * @returns 
     */
    setGift(qq: string, id: GiftId) {
        if (this.only) { return; }
        this.reset();
        this.only = true;
        this.content.push({
            "type": "gift",
            "data": { qq, id }
        });
        return this;
    }

    // 仅接收
    // /**
    //  * 合并转发
    //  * ```
    //  * 因为合并转发里面不能包含其他内容,所以设置后将清除已设置内容并且无法进行后续任何添加操作
    //  * * 添加唯一属性
    //  * ```
    //  * @param id 合并转发ID, 需要通过 /get_forward_msg API获取转发的具体内容
    //  */
    // setForward(id: string) {
    //     if (this.only) { return; }
    //     this.reset();
    //     this.only = true;
    //     this.context.push({
    //         "type": "forward",
    //         "data": { id }
    //     });
    //     return this;
    // }

    /**
     * 重新设置内容(可解除唯一属性)
     */
    reset() {
        this.only = false;
        this.forwardNode = undefined;
        this.content = [];
        return this;
    }

    /**
     * 将现有内容转CQ码字符串
     */
    toCQCodeString() {
        if (!!this.forwardNode) { return ""; }
        return Msg_InfoToStringMsg(this.content);
    }

    /**
     * 将现有内容转MsgInfo类(消息ID为-1)
     */
    toMsgInfo() {
        if (!!this.forwardNode) { return new MsgInfo({ "message": "", "message_id": -1, "raw_message": "" }); }
        return new MsgInfo({
            "message": this.content,
            "message_id": -1,
            "raw_message": this.toCQCodeString()
        });
    }

    /**
     * 转合并转发消息节点
     * ``` markdown
     * * 添加唯一性
     * * 进入此模式后会设置其唯一性无法添加任何其他内容
     * * 无法使用toCQCodeString,toMsgInfo等等函数
     * * 进入此模式后会清除现添加的内容!
     * ```
     */
    toForwardNode() {
        this.reset();
        this.forwardNode = new ForwardNode(this);
        this.only = true;
        return this.forwardNode;
    }

    /**
     * 将其发送给?
     * @param sender 发送到
     */
    sendTo(_this: OneBotDocking, sender: SenderInfo | GroupInfo | GroupMemberInfo | FriendInfo) {
        if (!this.forwardNode) {
            return sender.sendMsg(_this, this.content);
        }
        return this.forwardNode.sendTo(_this, sender);
    }

    /**
     * 获取编辑内容(可获取ForwardNode中内容)
     * ``` markdown
     * ## 需要注意!
     * ### 合并转发消息节点按照文档所言只能通过其他API发送
     * ```
     */
    getContent() {
        if (!!this.forwardNode) { return this.forwardNode.getContent(); }
        return this.content;
    }

    toString() {
        return `<Class:${this.constructor.name}>\n${JSON.stringify(this.content)}`;
    }
}



class ForwardNode {
    private content: ForwardNodeData[] = [];
    constructor(public mib: MsgInfoBuilder) { }

    /**
     * 添加有ID的消息
     * @param message_id 消息ID
     */
    addMsg(message_id: string) {
        this.content.push({
            "type": "node",
            "data": {
                "id": message_id
            }
        });
        return this;
    }

    /**
     * 添加自定义消息
     * @param user_name 用户名称
     * @param user_id 用户QQ号
     * @param msg 具体消息
     */
    addCustomMsg(user_name: string, user_id: string, msg: Msg_Info[] | MsgInfoBuilder | string) {
        this.content.push
        this.content.push({
            "type": "node",
            "data": {
                "name": user_name,
                "uin": user_id,
                "content": msg instanceof MsgInfoBuilder ? msg.getContent() : msg
            }
        });
        return this;
    }

    reset() {
        this.content = [];
        return this;
    }


    sendTo(_this: OneBotDocking, sender: SenderInfo | GroupInfo | GroupMemberInfo | FriendInfo) {
        // _this.getGroupMsgHistory
        if (sender instanceof FriendInfo || sender instanceof GroupMemberInfo) {
            return _this.sendPrivateForwardMsgEx(sender.user_id, this.content);
        } else if (sender instanceof GroupInfo) {
            return _this.sendGroupForwardMsgEx(sender.group_id, this.content);
        } else if (sender instanceof SenderInfo) {
            if (sender._isGroupMember) {
                return _this.sendPrivateForwardMsgEx(sender.user_id, this.content);
            }// else if (sender._isGuildMember) {
            // }
        }
        return new Promise<undefined>(r => r(undefined));
    }

    getContent() { return this.content; }

    toString() {
        return `<Class:${this.constructor.name}>\n${JSON.stringify(this.content)}`;
    }
}