/** 频道中的发送者 */
export class GuildSender {
    constructor(private obj: {
        "tiny_id": string,
        "nickname": string
    }) { }
    /** 用户ID */
    get tiny_id() { return this.obj.tiny_id; }
    /** 
     * [这玩意就是tiny_id]{@link tiny_id}
     */
    get user_id() { return this.tiny_id; }
    get nickname() { return this.obj.nickname; }
}