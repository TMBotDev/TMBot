export class GuildInfo {
    constructor(private obj: {
        "guild_id": string,
        "guild_name": string,
        "guild_display_id": number
    }) { }
    /** 频道ID */
    get guild_id() { return this.obj.guild_id; }
    /** 频道名称 */
    get guild_name() { return this.obj.guild_name; }
    /** 频道显示ID */
    get guild_display_id() { return this.obj.guild_display_id; }
}