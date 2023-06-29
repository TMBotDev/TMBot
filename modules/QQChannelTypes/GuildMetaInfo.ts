
/**
 * 频道元数据
 */
export class GuildMetaInfo {
    constructor(private obj: {
        "guild_id": string,	//频道ID
        "guild_name": string,	//频道名称
        "guild_profile": string,	//频道简介
        "create_time": number,	//创建时间
        "max_member_count": number,	//频道人数上限
        "max_robot_count": number,	//频道BOT数上限
        "max_admin_count": number,	//频道管理员人数上限
        "member_count": number,	//已加入人数
        "owner_id": string	//创建者ID
    }) { }
    /** 频道ID */
    get guild_id() { return this.obj.guild_id; }
    /** 频道名称 */
    get guild_name() { return this.obj.guild_name; }
    /** 频道简介 */
    get guild_profile() { return this.obj.guild_profile; }
    /** 创建时间 */
    get create_time() { return this.obj.create_time; }
    /** 频道人数上限 */
    get max_member_count() { return this.obj.max_member_count; }
    /** 频道BOT数上限 */
    get max_robot_count() { return this.obj.max_robot_count; }
    /** 频道管理员人数上限 */
    get max_admin_count() { return this.obj.max_admin_count; }
    /** 已加入人数 */
    get member_count() { return this.obj.member_count; }
    /** 创建者ID */
    get owner_id() { return this.obj.owner_id; }

    toString() {
        return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj, null, 2)}`;
    }
}