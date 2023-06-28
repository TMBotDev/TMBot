import { OneBotDocking } from "../OneBotDocking";

type ForwardMsg = { "content": string, "sender": { "nickname": string, "user_id": number }, "time": number }
export type ForwardMsgs = Array<ForwardMsg>;

export class ForwardMessageInfo {
    static async getForwardMsgForId(_this: OneBotDocking, id: string) {
        return await _this.getForwardMsgEx(id);
    }

    constructor(private forwardMsg: ForwardMsgs) { }
    get size() { return this.forwardMsg.length; }
    get _ori() { return this.forwardMsg; }
    getContent(index: number) { return this.forwardMsg[index]; }
    forEach(fn: (i: number, v: ForwardMsg) => boolean) {
        let l = this.forwardMsg.length, i = 0;
        while (i < l) {
            if (fn(i, this.forwardMsg[i]) === true) {
                return this.forwardMsg[i];
            }
            i++;
        }
        return undefined;
    }


    toString() {
        return `<Class::${this.constructor.name}>\n${JSON.stringify(this.forwardMsg)}`;
    }
}