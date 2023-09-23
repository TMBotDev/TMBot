/**
 * 权限组信息
 */
import { GuildSystem } from "../GuildSystem";

type int64 = number;
type int32 = number;
type bool = boolean;


/** 和"GuildMemberInfo"的RoleInfo类差不多,此为增强版本的类 */
export class GuildRole {
    constructor(private obj: {
        /** 颜色值(示例: 4294927682) */
        "argb_color": int64,
        /** 是否启用 */
        "disabled": bool,
        /** 未知 */
        "independent": bool,
        /** 最大多少人拥有此角色 */
        "max_count": int32,
        /** 多少人拥有此角色 */
        "member_count": int32,
        /** 未知 */
        "owned": bool,
        /** 角色id */
        "role_id": string,
        /** 角色名 */
        "role_name": string
    }, private guild_id: string) { }
    /** 颜色值(示例: 4294927682) */
    get argb_color() { return this.obj.argb_color; }
    /** 是否启用 */
    get disabled() { return this.obj.disabled; }
    /** 未知 */
    get independent() { return this.obj.independent; }
    /** 最大多少人拥有此角色 */
    get max_count() { return this.obj.max_count; }
    /** 多少人拥有此角色 */
    get member_count() { return this.obj.member_count; }
    /** 未知 */
    get owned() { return this.obj.owned; }
    /** 角色id */
    get role_id() { return this.obj.role_id; }
    /** 角色名 */
    get role_name() { return this.obj.role_name; }

    deleteThisGuildRole(_this: GuildSystem) {
        return _this.deleteGuildRole
    }

    toString() {
        return `<Class:${this.constructor.name}>\n${JSON.stringify(this.obj, null, 2)}`;
    }
}