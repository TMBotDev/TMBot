/**
 * ``` txt
 * 群基础信息
 * 请勿长期保存
 * ```
 */
export class GroupBaseInfo {
    constructor(private obj: {
        "group_id": number,
        "group_name": string,
        "member_count": number,
        "max_member_count": number
    }) { }
    get group_id() {
        return this.obj.group_id;
    }
    get group_name() { return this.obj.group_name; }
    get member_count() { return this.obj.member_count; }
    get max_member_count() { return this.obj.max_member_count; }
    toString() { return `<Class::${this.constructor.name}>\n${JSON.stringify(this.obj)}`; }
}