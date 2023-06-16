import { GuildSystem } from "../GuildSystem";

/** 频道中的发送者 */
export class GuildSenderInfo {
    constructor(private obj: {
        "tiny_id": string,
        "user_id": number,
        "nickname": string
    }) { }
    /** 用户ID */
    get tiny_id() { return this.obj.tiny_id; }
    /** 
     * [这玩意就是tiny_id]{@link tiny_id}
     */
    get user_id() { return this.tiny_id; }
    /**
     * 直接传入的user_id,因数字过大,这个值不精准
     */
    get user_id_Num() { return this.obj.user_id; }
    get nickname() { return this.obj.nickname; }
    getDetail(_this: GuildSystem, guild_id: string, no_cache = false) {
        return _this.getGuildMemberProfileEx(guild_id, this.obj.tiny_id, no_cache);
    }

    toString() {
        return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj, null, 2)}`;
    }
}