

export class GuildMemberInfo {
    constructor(private obj: {
        "tiny_id": string,//用户ID
        "title": string,//成员头衔
        "nickname": string,//成员昵称
        "role_id": string,//成员权限组ID
        "role_name": string//所在权限组名称
    }) { }
    /** 用户ID */
    get user_id() { return this.obj.tiny_id; }
    /** 用户ID */
    get tiny_id() { return this.obj.tiny_id; }
    /** 成员头衔 */
    get title() { return this.obj.title; }
    get nickname() { return this.obj.nickname; }
    /**
     * ```
     * 权限组ID
     * 默认情况下频道管理员的权限组ID为 2, 部分频道可能会另行创建, 需手动判断
     * 此接口仅展现最新的权限组, 获取用户加入的所有权限组请使用 get_guild_member_profile 接口
     * ```
     */
    get role_id() { return this.obj.role_id; }
    /** 所在权限组名称 */
    get role_name() { return this.obj.role_name; }
}

export class RoleInfo {
    constructor(private obj: {
        "role_id": number,
        "role_name": string
    }) { }
    get role_id() { return this.obj.role_id; }
    get role_name() { return this.obj.role_name; }
}

export class GuildMemberProfileInfo {
    private Roles: RoleInfo[] = [];
    constructor(private obj: {
        "tiny_id": string,//用户ID
        "nickname": string,//成员昵称
        "avatar_url": string,//用户头像
        "join_time": number,//加入时间
        "roles": {//加入的所有权限组
            "role_id": number,//权限组ID
            "role_name": string//权限组名称
        }[]
    }) {
        let l = obj.roles.length, i = 0;
        while (i < l) {
            this.Roles.push(new RoleInfo(obj.roles[i]));
            i++;
        }
    }
    /** 用户ID */
    get tiny_id() { return this.obj.tiny_id; }
    /** 用户ID */
    get user_id() { return this.obj.tiny_id; }
    /** 成员昵称 */
    get nickname() { return this.obj.nickname; }
    /** 用户头像 */
    get avatar_url() { return this.obj.avatar_url; }
    /** 加入时间 */
    get join_time() { return this.obj.join_time; }
    /** 加入的所有权限组 */
    get roles() { return this.Roles; }
    /** 寻找权限组(在函数内返回true可以立即返回当前权限组信息) */
    findRole(fn: (v: RoleInfo) => boolean) {
        let l = this.Roles.length, i = 0;
        while (i < l) {
            let role = this.Roles[i];
            if (!!fn(role)) {
                return role;
            }
            i++;
        }
        return;
    }
}