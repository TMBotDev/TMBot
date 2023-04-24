/**
 * 转发消息
 */
export class ForwardMsg {
    constructor(private obj: {
        "content": string,
        "sender": {
            "nickname": string,
            "user_id": number
        },
        "time": number
    }) { }
    get content() { return this.obj.content; }
    get sender() { return this.obj.sender; }
    get time() { return this.obj.time; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}