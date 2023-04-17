import { OneBotDocking } from "../OneBotDocking";

export type Msg_Info = {
    "type": string,
    "data": { [key: string]: string }
};

/**
 * 消息信息
 */
export class MsgInfo {
    constructor(private obj: {
        "message": string | Array<Msg_Info>,
        "raw_message": string,
        "message_id": number
    }) { }
    /**
     * ```
     * 撤回消息
     * (可能因各种原因失败)
     * ```
     * @param _this 
     * @returns 
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
}